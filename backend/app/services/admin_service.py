from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import AdminUser, Report, AdminAuditEvent
from app.security.passwords import verify_password
from app.security.tokens import coarse_now


class AdminError(Exception):
    pass


def authenticate(db: Session, username: str, password: str) -> AdminUser:
    stmt = select(AdminUser).where(AdminUser.username == username, AdminUser.is_active == True)
    user = db.execute(stmt).scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        raise AdminError("Invalid credentials.")
    return user


def list_reports(db: Session, status: str | None = None, category: str | None = None) -> list[dict]:
    stmt = select(Report)
    if status:
        stmt = stmt.where(Report.status == status)
    if category:
        stmt = stmt.where(Report.category == category)
    stmt = stmt.order_by(Report.created_at_bucket.desc())
    rows = db.execute(stmt).scalars().all()
    return [_public_view(r) for r in rows]


def get_report(db: Session, report_id: str) -> dict:
    stmt = select(Report).where(Report.id == report_id)
    r = db.execute(stmt).scalar_one_or_none()
    if r is None:
        raise AdminError("Report not found.")
    return _public_view(r)


def update_report(db: Session, admin: AdminUser, report_id: str, patch: dict) -> dict:
    stmt = select(Report).where(Report.id == report_id)
    r = db.execute(stmt).scalar_one_or_none()
    if r is None:
        raise AdminError("Report not found.")
    if "status" in patch and patch["status"] in {"received", "under_review", "resolved"}:
        r.status = patch["status"]
    if "moderator_note" in patch and isinstance(patch["moderator_note"], str):
        r.moderator_note = patch["moderator_note"]
    r.updated_at_bucket = coarse_now()
    db.add(AdminAuditEvent(
        admin_id=admin.id,
        report_id=r.id,
        action="update_report",
    ))
    db.commit()
    db.refresh(r)
    return _public_view(r)


def get_analytics(db: Session) -> dict:
    reports = db.execute(select(Report)).scalars().all()
    by_status: dict[str, int] = {}
    by_category: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for r in reports:
        by_status[r.status] = by_status.get(r.status, 0) + 1
        by_category[r.category] = by_category.get(r.category, 0) + 1
        by_severity[r.severity] = by_severity.get(r.severity, 0) + 1
    return {
        "total": len(reports),
        "by_status": by_status,
        "by_category": by_category,
        "by_severity": by_severity,
    }


def _public_view(r: Report) -> dict:
    # NEVER return tracking_secret_hash.
    return {
        "id": r.id,
        "category": r.category,
        "title": r.title,
        "description": r.description,
        "severity": r.severity,
        "status": r.status,
        "created_at": r.created_at_bucket.isoformat(),
        "updated_at": r.updated_at_bucket.isoformat(),
        "moderator_note": r.moderator_note or "",
    }
