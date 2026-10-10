from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Report
from app.security.tokens import new_tracking_secret, sha256_hex
from app.services.credential_service import consume_credential, CredentialError
from app.services.content_moderator import analyze_content, compute_duplicate_fingerprint

ALLOWED_CATEGORIES = {
    "harassment",
    "misconduct",
    "safety",
    "academic",
    "workplace",
    "fraud",
    "other",
}

ALLOWED_SEVERITIES = {"low", "medium", "high", "critical"}


class ReportError(Exception):
    pass


def _validate(payload: dict) -> None:
    if payload.get("category") not in ALLOWED_CATEGORIES:
        raise ReportError("Invalid category.")
    if payload.get("severity") not in ALLOWED_SEVERITIES:
        raise ReportError("Invalid severity.")
    title = (payload.get("title") or "").strip()
    description = (payload.get("description") or "").strip()
    if len(title) < 4 or len(title) > 200:
        raise ReportError("Title must be 4–200 characters.")
    if len(description) < 20 or len(description) > 4000:
        raise ReportError("Description must be 20–4000 characters.")


def submit_report(db: Session, payload: dict) -> dict:
    """
    Single transaction:
    1. Validate inputs
    2. Check for spam / harmful threats
    3. Check privacy-preserving duplicate fingerprint
    4. Atomically consume credential (blind signature or signed token)
    5. Save confidential report in Ombudsman escrow with accurate filing timestamp
    """
    _validate(payload)

    company_name = (payload.get("company_name") or "Acme Technologies").strip()
    title = payload["title"].strip()
    description = payload["description"].strip()
    category = payload["category"]
    severity = payload["severity"]

    # 1. Content moderation & Spam analysis
    mod_result = analyze_content(title, description, category)
    if mod_result["is_spam"]:
        raise ReportError(f"Submission rejected: {mod_result['spam_reason'] or 'Spam detected.'}")

    # 2. Privacy-preserving duplicate detection
    dup_fingerprint = compute_duplicate_fingerprint(company_name, category, title, description)
    recent_cutoff = datetime.utcnow() - timedelta(hours=48)
    stmt_dup = select(Report).where(
        Report.duplicate_fingerprint == dup_fingerprint,
        Report.filed_at >= recent_cutoff,
    )
    existing_dup = db.execute(stmt_dup).first()
    if existing_dup:
        raise ReportError("Duplicate incident report: A report describing this identical situation has already been securely filed.")

    # 3. Consume credential
    try:
        consume_credential(db, payload)
    except CredentialError as e:
        db.rollback()
        raise ReportError(str(e))

    # 4. Generate tracking secret
    tracking_secret = new_tracking_secret()
    now = datetime.utcnow()

    # If critical harm is detected, prioritize severity
    effective_severity = severity
    if mod_result["severity_suggested"] == "critical":
        effective_severity = "critical"

    flags_str = ",".join(mod_result["flags"]) if mod_result["flags"] else ""
    reporter_phone = payload.get("reporter_phone")
    clean_phone = reporter_phone.strip() if reporter_phone and isinstance(reporter_phone, str) else None

    report = Report(
        company_name=company_name,
        tracking_secret_hash=sha256_hex(tracking_secret),
        duplicate_fingerprint=dup_fingerprint,
        category=category,
        title=title,
        description=description,
        executive_summary=mod_result["executive_summary_preview"],
        severity=effective_severity,
        status="received",
        is_spam=False,
        harm_score=mod_result["harm_score"],
        harm_flags=flags_str,
        ombudsman_intervention=mod_result["requires_intervention"],
        intervention_reason="Automated safety escalation: Critical incident signals flagged during ingestion." if mod_result["requires_intervention"] else "",
        whistleblower_safety_level="protected_escrow",
        moderator_note="",
        reporter_phone=clean_phone,
        filed_at=now,
        updated_at=now,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id": report.id,
        "tracking_secret": tracking_secret,
        "status": report.status,
        "company_name": report.company_name,
        "filed_at": report.filed_at.isoformat(),
        "is_spam": False,
        "harm_score": report.harm_score,
        "harm_flags": mod_result["flags"],
        "reporter_phone": report.reporter_phone,
    }



def track_report(db: Session, report_id: str, tracking_secret: str) -> dict:
    stmt = select(Report).where(Report.id == report_id)
    report = db.execute(stmt).scalar_one_or_none()
    if report is None:
        raise ReportError("Report not found.")
    if report.tracking_secret_hash != sha256_hex(tracking_secret):
        raise ReportError("Report not found.")

    return {
        "report_id": report.id,
        "company_name": report.company_name,
        "category": report.category,
        "title": report.title,
        "status": report.status,
        "filed_at": report.filed_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
        "ombudsman_intervention": report.ombudsman_intervention,
        "executive_summary": report.executive_summary or "Preliminary review in progress by independent ombudsman.",
        "moderator_note": report.moderator_note or "",
    }
