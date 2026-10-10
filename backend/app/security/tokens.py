import hashlib
import secrets
import base64
from datetime import datetime, timedelta, timezone
from app.config import get_settings
from app.security.keys import sign, verify


def new_random_tag() -> str:
    return "cred_" + secrets.token_urlsafe(24)


def new_tracking_secret() -> str:
    return secrets.token_urlsafe(32)


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def coarse_now(bucket_seconds: int | None = None) -> datetime:
    b = bucket_seconds or get_settings().timestamp_bucket_seconds
    now = datetime.now(timezone.utc)
    epoch = int(now.timestamp())
    floored = epoch - (epoch % b)
    return datetime.fromtimestamp(floored, tz=timezone.utc).replace(tzinfo=None)


def build_signed_credential(tag: str, expires_at: datetime) -> str:
    ts = int(expires_at.replace(tzinfo=timezone.utc).timestamp())
    payload = f"{tag}|{ts}".encode()
    sig = sign(payload)
    return base64.urlsafe_b64encode(payload + b"." + sig).decode()


def parse_and_verify_credential(token: str) -> tuple[str, datetime]:
    try:
        raw = base64.urlsafe_b64decode(token.encode())
        # Ed25519 signature is always 64 bytes. Followed by separator b'.' before the signature.
        if len(raw) <= 65 or raw[-65:-64] != b".":
            raise ValueError("Malformed credential token")
        payload = raw[:-65]
        sig = raw[-64:]
    except Exception:
        raise ValueError("Malformed credential token")

    if not verify(payload, sig):
        raise ValueError("Invalid signature")

    try:
        tag_b, exp_b = payload.split(b"|", 1)
        tag = tag_b.decode()
        expires_at = datetime.fromtimestamp(int(exp_b), tz=timezone.utc).replace(tzinfo=None)
    except Exception:
        raise ValueError("Malformed credential payload")

    return tag, expires_at


def is_expired(expires_at: datetime) -> bool:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return now > expires_at


def ttl_delta() -> timedelta:
    return timedelta(seconds=get_settings().credential_ttl_seconds)
