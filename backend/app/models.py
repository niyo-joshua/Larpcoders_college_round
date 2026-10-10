import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    industry: Mapped[str] = mapped_column(String(64), default="Technology")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Member(Base):
    __tablename__ = "members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    member_code_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    company_name: Mapped[str] = mapped_column(String(100), default="Acme Technologies")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tag_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_blind: Mapped[bool] = mapped_column(Boolean, default=False)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    company_name: Mapped[str] = mapped_column(String(100), default="Acme Technologies", index=True)
    tracking_secret_hash: Mapped[str] = mapped_column(String(64), index=True)
    duplicate_fingerprint: Mapped[str] = mapped_column(String(64), index=True)

    category: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(String(200))
    # Confidential raw report (held in secure Ombudsman Escrow)
    description: Mapped[str] = mapped_column(Text)
    # Sanitized partial summary visible to the company without whistleblower identity or style clues
    executive_summary: Mapped[str] = mapped_column(Text, default="")

    severity: Mapped[str] = mapped_column(String(16))  # low, medium, high, critical
    status: Mapped[str] = mapped_column(String(32), default="received")  # received, under_review, company_notified, investigation_active, resolved

    # Automated safety & moderation signals
    is_spam: Mapped[bool] = mapped_column(Boolean, default=False)
    harm_score: Mapped[int] = mapped_column(Integer, default=0)
    harm_flags: Mapped[str] = mapped_column(String(255), default="")

    # Ombudsman moderation & intervention
    ombudsman_intervention: Mapped[bool] = mapped_column(Boolean, default=False)
    intervention_reason: Mapped[str] = mapped_column(Text, default="")
    whistleblower_safety_level: Mapped[str] = mapped_column(String(32), default="protected_escrow")
    moderator_note: Mapped[str] = mapped_column(Text, default="")

    # Whistleblower verified contact (accessible strictly to moderator, shielded from admin & company)
    reporter_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Accurate timestamps
    filed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PhoneVerification(Base):
    __tablename__ = "phone_verifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    phone_number: Mapped[str] = mapped_column(String(32), index=True)
    otp_code: Mapped[str] = mapped_column(String(6))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="ombudsman")  # ombudsman, moderator, company_reviewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AdminAuditEvent(Base):
    __tablename__ = "admin_audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    admin_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_users.id"))
    report_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
