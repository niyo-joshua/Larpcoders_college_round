import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Member(Base):
    __tablename__ = "members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    member_code_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tag_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    issued_at_bucket: Mapped[datetime] = mapped_column(DateTime)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tracking_secret_hash: Mapped[str] = mapped_column(String(64))
    category: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(16), default="received")
    created_at_bucket: Mapped[datetime] = mapped_column(DateTime)
    updated_at_bucket: Mapped[datetime] = mapped_column(DateTime)
    moderator_note: Mapped[str] = mapped_column(Text, default="")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16), default="admin")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AdminAuditEvent(Base):
    __tablename__ = "admin_audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    admin_id: Mapped[str] = mapped_column(String(36), ForeignKey("admin_users.id"))
    report_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
