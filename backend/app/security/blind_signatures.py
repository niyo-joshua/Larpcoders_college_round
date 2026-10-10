import hashlib
import os
import secrets
from functools import lru_cache
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# Key storage path
KEY_DIR = os.path.dirname(os.path.abspath(__file__))
RSA_KEY_PATH = os.path.join(KEY_DIR, "blind_rsa_key.pem")


def _get_or_create_rsa_key() -> rsa.RSAPrivateKey:
    """Load existing RSA key from disk or generate a fresh 2048-bit key."""
    if os.path.exists(RSA_KEY_PATH):
        try:
            with open(RSA_KEY_PATH, "rb") as f:
                return serialization.load_pem_private_key(f.read(), password=None)
        except Exception:
            pass

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    with open(RSA_KEY_PATH, "wb") as f:
        f.write(pem)
    return key


_rsa_key = _get_or_create_rsa_key()


def get_public_key_params() -> dict[str, str]:
    """Return public modulus n and exponent e as hex strings."""
    pub_numbers = _rsa_key.public_key().public_numbers()
    return {
        "n": hex(pub_numbers.n)[2:],
        "e": hex(pub_numbers.e)[2:],
        "key_size": "2048",
    }


def blind_sign_message(blinded_int_hex: str) -> str:
    """
    Sign a blinded message integer provided by the client.
    s' = (m')^d mod N
    Server never learns the underlying message m or tag t!
    """
    blinded_int = int(blinded_int_hex, 16)
    priv_numbers = _rsa_key.private_numbers()
    pub_numbers = _rsa_key.public_key().public_numbers()

    n = pub_numbers.n
    d = priv_numbers.d

    if blinded_int <= 0 or blinded_int >= n:
        raise ValueError("Blinded message out of valid modulus range.")

    s_prime = pow(blinded_int, d, n)
    return hex(s_prime)[2:]


def verify_blind_signature(tag: str, signature_hex: str) -> bool:
    """
    Verify that s^e mod N == H(tag) mod N.
    Mathematical proof: (s'^r^-1)^e == (m')^e * r^-e == m * r^e * r^-e == m == H(tag).
    """
    try:
        s = int(signature_hex, 16)
        pub_numbers = _rsa_key.public_key().public_numbers()
        n = pub_numbers.n
        e = pub_numbers.e

        if s <= 0 or s >= n:
            return False

        # Message hash mapped to integer mod n
        m = int.from_bytes(hashlib.sha256(tag.encode("utf-8")).digest(), "big") % n

        # s^e mod n must equal m
        recovered_m = pow(s, e, n)
        return recovered_m == m
    except Exception:
        return False


def client_blind_helper(tag: str, n_hex: str, e_hex: str) -> tuple[str, str]:
    """
    Helper for test suite and client blinding simulations:
    Given secret tag, blinds the message hash and returns (blinded_hex, r_hex).
    """
    n = int(n_hex, 16)
    e = int(e_hex, 16)

    m = int.from_bytes(hashlib.sha256(tag.encode("utf-8")).digest(), "big") % n

    # Pick random blinding factor coprime to n
    r = secrets.randbelow(n - 2) + 2
    while pow(r, -1, n) is None:
        r = secrets.randbelow(n - 2) + 2

    # m' = (m * r^e) mod n
    m_prime = (m * pow(r, e, n)) % n
    return hex(m_prime)[2:], hex(r)[2:]


def client_unblind_helper(blinded_signature_hex: str, r_hex: str, n_hex: str) -> str:
    """
    Helper for test suite and client unblinding simulations:
    s = (s' * r^-1) mod n
    """
    s_prime = int(blinded_signature_hex, 16)
    r = int(r_hex, 16)
    n = int(n_hex, 16)

    r_inv = pow(r, -1, n)
    s = (s_prime * r_inv) % n
    return hex(s)[2:]
