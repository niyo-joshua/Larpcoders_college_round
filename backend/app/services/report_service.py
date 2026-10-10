from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Report
from app.security.tokens import (
    new_tracking_secret,
    sha256_hex,
    coarse_now,
)
from app.services.credential_service import consume_credential, CredentialError

ALLOWED_CATEGORIES = {
    "harassment",
    "misconduct",
    "safety",
    "academic",
    "workplace",
    "other",
}

ALLOWED_SEVERITIES = {"low", "medium", "high"}


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
    Single transaction: validate -> consume credential -> insert report.
    Reports never store the credential tag or member id.
    """
    _validate(payload)
    try:
        consume_credential(db, payload["credential"])
    except CredentialError as e:
        db.rollback()
        raise ReportError(str(e))

    tracking_secret = new_tracking_secret()
    now_bucket = coarse_now()
    report = Report(
        tracking_secret_hash=sha256_hex(tracking_secret),
        category=payload["category"],
        title=payload["title"].strip(),
        description=payload["description"].strip(),
        severity=payload["severity"],
        status="received",
        created_at_bucket=now_bucket,
        updated_at_bucket=now_bucket,
        moderator_note="",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {
        "report_id": report.id,
        "tracking_secret": tracking_secret,
        "status": report.status,
    }


def track_report(db: Session, report_id: str, tracking_secret: str) -> dict:
    stmt = select(Report).where(Report.id == report_id)
    report = db.execute(stmt).scalar_one_or_none()
    if report is None:
        raise ReportError("Report not found.")
    if report.tracking_secret_hash != sha256_hex(tracking_secret):
        raise ReportError("Report not found.")
    return {
        "status": report.status,
        "updated_at": report.updated_at_bucket.isoformat(),
    }
