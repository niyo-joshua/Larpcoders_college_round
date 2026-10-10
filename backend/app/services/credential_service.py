from datetime import datetime
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models import Member, Credential
from app.security.passwords import verify_password
from app.security.tokens import (
    new_random_tag,
    sha256_hex,
    build_signed_credential,
    ttl_delta,
    coarse_now,
    parse_and_verify_credential,
    is_expired,
)


class CredentialError(Exception):
    pass


def redeem_eligibility_code(db: Session, eligibility_code: str) -> tuple[str, int]:
    """
    Validate eligibility code against members table.
    Issue a signed credential that is NOT linked to the member.
    Returns (signed_credential_token, expires_in_seconds).
    """
    stmt = select(Member).where(Member.is_active == True)
    members = db.execute(stmt).scalars().all()
    matched = None
    for m in members:
        if verify_password(eligibility_code, m.member_code_hash):
            matched = m
            break
    if matched is None:
        raise CredentialError("Invalid or inactive eligibility code.")

    tag = new_random_tag()
    expires_at = datetime.utcnow() + ttl_delta()
    cred = Credential(
        tag_hash=sha256_hex(tag),
        expires_at=expires_at,
        issued_at_bucket=coarse_now(),
    )
    db.add(cred)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise CredentialError("Credential issuance conflict. Try again.")

    token = build_signed_credential(tag, expires_at)
    return token, int(ttl_delta().total_seconds())


def consume_credential(db: Session, token: str) -> None:
    """
    Verify signature, check expiry, atomically mark consumed.
    Raises CredentialError on any failure.
    """
    try:
        tag, expires_at = parse_and_verify_credential(token)
    except Exception:
        raise CredentialError("Invalid credential.")

    if is_expired(expires_at):
        raise CredentialError("Credential expired.")

    tag_hash = sha256_hex(tag)
    stmt = select(Credential).where(Credential.tag_hash == tag_hash)
    try:
        if db.bind and db.bind.dialect.name != "sqlite":
            stmt = stmt.with_for_update()
    except Exception:
        pass

    cred = db.execute(stmt).scalar_one_or_none()
    if cred is None:
        raise CredentialError("Unknown credential.")
    if cred.consumed_at is not None:
        raise CredentialError("Credential already used.")
    cred.consumed_at = datetime.utcnow()
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise CredentialError("Credential already used.")
