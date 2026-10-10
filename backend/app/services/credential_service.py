import random
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models import Member, Credential, PhoneVerification
from app.security.passwords import verify_password
from app.security.tokens import (
    new_random_tag,
    sha256_hex,
    build_signed_credential,
    ttl_delta,
    parse_and_verify_credential,
    is_expired,
)
from app.security.blind_signatures import (
    blind_sign_message,
    verify_blind_signature,
    get_public_key_params,
)


class CredentialError(Exception):
    pass


def normalize_phone(phone: str) -> str:
    return phone.strip()


def send_phone_verification_code(db: Session, phone_number: str) -> dict:
    """
    Generate and persist a 6-digit verification OTP for the provided phone number.
    In development/demo mode, returns demo_otp for immediate testing.
    """
    clean_phone = normalize_phone(phone_number)
    if len(clean_phone) < 7:
        raise CredentialError("Please enter a valid phone number.")

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"

    # Save to database with 10-minute validity
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    verification = PhoneVerification(
        phone_number=clean_phone,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False,
    )
    db.add(verification)
    db.commit()

    return {
        "message": f"Verification code sent to {clean_phone}.",
        "demo_otp": otp_code,
        "phone_number": clean_phone,
    }


def verify_phone_otp(db: Session, phone_number: str, otp_code: str) -> tuple[str, int]:
    """
    Validates phone number and OTP code.
    Issues a signed one-time credential for filing a report.
    Returns (signed_credential_token, expires_in_seconds).
    """
    clean_phone = normalize_phone(phone_number)
    clean_otp = otp_code.strip()

    stmt = (
        select(PhoneVerification)
        .where(
            PhoneVerification.phone_number == clean_phone,
            PhoneVerification.otp_code == clean_otp,
            PhoneVerification.expires_at >= datetime.utcnow(),
        )
        .order_by(PhoneVerification.created_at.desc())
    )
    record = db.execute(stmt).scalars().first()
    if not record:
        raise CredentialError("Invalid or expired verification code. Please check your SMS code or request a new one.")

    record.is_verified = True

    tag = new_random_tag()
    expires_at = datetime.utcnow() + ttl_delta()
    cred = Credential(
        tag_hash=sha256_hex(tag),
        expires_at=expires_at,
        issued_at=datetime.utcnow(),
        is_blind=False,
    )
    db.add(cred)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise CredentialError("Credential issuance conflict. Try again.")

    token = build_signed_credential(tag, expires_at)
    return token, int(ttl_delta().total_seconds())


def issue_blind_signature_with_phone(db: Session, phone_number: str, otp_code: str, blinded_message: str) -> dict:
    """
    Issues an RSA Blind Signature after verifying the phone number and OTP.
    """
    clean_phone = normalize_phone(phone_number)
    clean_otp = otp_code.strip()

    stmt = (
        select(PhoneVerification)
        .where(
            PhoneVerification.phone_number == clean_phone,
            PhoneVerification.otp_code == clean_otp,
            PhoneVerification.expires_at >= datetime.utcnow(),
        )
        .order_by(PhoneVerification.created_at.desc())
    )
    record = db.execute(stmt).scalars().first()
    if not record:
        raise CredentialError("Invalid or expired verification code.")

    record.is_verified = True
    db.commit()

    try:
        blinded_sig = blind_sign_message(blinded_message)
    except Exception as e:
        raise CredentialError(f"Blind signature generation failed: {str(e)}")

    params = get_public_key_params()
    return {
        "blinded_signature": blinded_sig,
        "n": params["n"],
        "e": params["e"],
    }


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
        issued_at=datetime.utcnow(),
        is_blind=False,
    )
    db.add(cred)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise CredentialError("Credential issuance conflict. Try again.")

    token = build_signed_credential(tag, expires_at)
    return token, int(ttl_delta().total_seconds())


def issue_blind_signature(db: Session, eligibility_code: str, blinded_message: str) -> dict:
    """
    Issue an RSA Blind Signature for the client's blinded message.
    Validates that the submitter is an eligible member.
    Server signs without knowing what message or tag the client is submitting!
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

    try:
        blinded_sig = blind_sign_message(blinded_message)
    except Exception as e:
        raise CredentialError(f"Blind signature generation failed: {str(e)}")

    params = get_public_key_params()
    return {
        "blinded_signature": blinded_sig,
        "n": params["n"],
        "e": params["e"],
    }


def consume_credential(db: Session, token_or_blind: dict | str) -> None:
    """
    Atomically verifies credential and marks it consumed.
    Supports both classic Ed25519 signed tokens and RSA Blind Signatures.
    Raises CredentialError on forged, expired, or replayed credential.
    """
    if isinstance(token_or_blind, dict) and (token_or_blind.get("blind_tag") and token_or_blind.get("blind_signature")):
        # Blind signature flow
        tag = token_or_blind["blind_tag"]
        sig = token_or_blind["blind_signature"]

        if not verify_blind_signature(tag, sig):
            raise CredentialError("Invalid cryptographic blind signature.")

        tag_hash = sha256_hex(tag)
        # Check if already spent
        stmt = select(Credential).where(Credential.tag_hash == tag_hash)
        try:
            if db.bind and db.bind.dialect.name != "sqlite":
                stmt = stmt.with_for_update()
        except Exception:
            pass

        cred = db.execute(stmt).scalar_one_or_none()
        if cred is not None:
            raise CredentialError("Credential already used.")

        # Record tag hash as spent atomically
        new_spent = Credential(
            tag_hash=tag_hash,
            expires_at=datetime.utcnow() + ttl_delta(),
            consumed_at=datetime.utcnow(),
            issued_at=datetime.utcnow(),
            is_blind=True,
        )
        db.add(new_spent)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            raise CredentialError("Credential already used.")
        return

    # Classic signed token flow
    token = token_or_blind if isinstance(token_or_blind, str) else token_or_blind.get("credential", "")
    if not token:
        raise CredentialError("Missing credential.")

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
