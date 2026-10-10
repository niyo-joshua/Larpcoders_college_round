import base64
from nacl.signing import SigningKey, VerifyKey
from app.config import get_settings


def _load_signing_key() -> SigningKey:
    settings = get_settings()
    if not settings.signing_key_b64:
        raise RuntimeError("SIGNING_KEY_B64 not set. Run `python seed_demo.py --gen-key`.")
    raw = base64.b64decode(settings.signing_key_b64)
    return SigningKey(raw)


def sign(message: bytes) -> bytes:
    sk = _load_signing_key()
    return sk.sign(message).signature


def verify(message: bytes, signature: bytes) -> bool:
    try:
        sk = _load_signing_key()
        vk = sk.verify_key
        vk.verify(message, signature)
        return True
    except Exception:
        return False


def public_key_b64() -> str:
    sk = _load_signing_key()
    return base64.b64encode(bytes(sk.verify_key)).decode()
