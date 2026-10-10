from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import AdminUser, Report, AdminAuditEvent
from app.security.passwords import verify_password


class AdminError(Exception):
    pass


def authenticate(db: Session, username: str, password: str) -> AdminUser:
    stmt = select(AdminUser).where(AdminUser.username == username, AdminUser.is_active == True)
    user = db.execute(stmt).scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        raise AdminError("Invalid credentials.")
    return user


def list_reports(
    db: Session,
    status: str | None = None,
    category: str | None = None,
    company: str | None = None,
) -> list[dict]:
    stmt = select(Report)
    if status:
        stmt = stmt.where(Report.status == status)
    if category:
        stmt = stmt.where(Report.category == category)
    if company:
        stmt = stmt.where(Report.company_name == company)
    stmt = stmt.order_by(Report.filed_at.desc())
    rows = db.execute(stmt).scalars().all()
    return [_ombudsman_view(r) for r in rows]


def get_report(db: Session, report_id: str) -> dict:
    stmt = select(Report).where(Report.id == report_id)
    r = db.execute(stmt).scalar_one_or_none()
    if r is None:
        raise AdminError("Report not found.")
    return _ombudsman_view(r)


def update_report(db: Session, admin: AdminUser, report_id: str, patch: dict) -> dict:
    stmt = select(Report).where(Report.id == report_id)
    r = db.execute(stmt).scalar_one_or_none()
    if r is None:
        raise AdminError("Report not found.")

    if "status" in patch and patch["status"]:
        r.status = patch["status"]
    if "executive_summary" in patch and isinstance(patch["executive_summary"], str):
        r.executive_summary = patch["executive_summary"]
    if "moderator_note" in patch and isinstance(patch["moderator_note"], str):
        r.moderator_note = patch["moderator_note"]
    if "ombudsman_intervention" in patch and isinstance(patch["ombudsman_intervention"], bool):
        r.ombudsman_intervention = patch["ombudsman_intervention"]
    if "intervention_reason" in patch and isinstance(patch["intervention_reason"], str):
        r.intervention_reason = patch["intervention_reason"]
    if "whistleblower_safety_level" in patch and isinstance(patch["whistleblower_safety_level"], str):
        r.whistleblower_safety_level = patch["whistleblower_safety_level"]

    r.updated_at = datetime.utcnow()
    db.add(AdminAuditEvent(
        admin_id=admin.id,
        report_id=r.id,
        action="update_report",
    ))
    db.commit()
    db.refresh(r)
    return _ombudsman_view(r)


def list_company_sanitized_reports(db: Session, company_name: str) -> list[dict]:
    """
    Company-facing view: NEVER exposes raw report text, zero submitter identity.
    Only provides sanitized executive summaries approved by the Ombudsman.
    """
    stmt = select(Report).where(Report.company_name == company_name).order_by(Report.filed_at.desc())
    rows = db.execute(stmt).scalars().all()
    return [
        {
            "id": r.id,
            "company_name": r.company_name,
            "category": r.category,
            "title": r.title,
            "severity": r.severity,
            "status": r.status,
            "filed_at": r.filed_at.isoformat(),
            "executive_summary": r.executive_summary or "Moderation summary being prepared.",
            "ombudsman_intervention": r.ombudsman_intervention,
        }
        for r in rows
    ]


def get_analytics(db: Session) -> dict:
    reports = db.execute(select(Report)).scalars().all()
    by_status: dict[str, int] = {}
    by_category: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    by_company: dict[str, int] = {}
    critical_interventions = 0
    total_harm_score = 0

    for r in reports:
        by_status[r.status] = by_status.get(r.status, 0) + 1
        by_category[r.category] = by_category.get(r.category, 0) + 1
        by_severity[r.severity] = by_severity.get(r.severity, 0) + 1
        by_company[r.company_name] = by_company.get(r.company_name, 0) + 1
        if r.ombudsman_intervention:
            critical_interventions += 1
        total_harm_score += r.harm_score

    avg_harm = round(total_harm_score / len(reports), 1) if reports else 0

    return {
        "total": len(reports),
        "by_status": by_status,
        "by_category": by_category,
        "by_severity": by_severity,
        "by_company": by_company,
        "critical_interventions": critical_interventions,
        "average_harm_score": avg_harm,
    }


def _ombudsman_view(r: Report) -> dict:
    """Full confidential view for independent Ombudsman investigator."""
    flags_list = [f.strip() for f in r.harm_flags.split(",") if f.strip()] if r.harm_flags else []
    return {
        "id": r.id,
        "company_name": r.company_name,
        "category": r.category,
        "title": r.title,
        "description": r.description,
        "executive_summary": r.executive_summary or "",
        "severity": r.severity,
        "status": r.status,
        "filed_at": r.filed_at.isoformat(),
        "updated_at": r.updated_at.isoformat(),
        "is_spam": r.is_spam,
        "harm_score": r.harm_score,
        "harm_flags": flags_list,
        "ombudsman_intervention": r.ombudsman_intervention,
        "intervention_reason": r.intervention_reason or "",
        "whistleblower_safety_level": r.whistleblower_safety_level or "protected_escrow",
        "moderator_note": r.moderator_note or "",
    }
