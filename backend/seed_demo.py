import argparse
import base64
import os
from nacl.signing import SigningKey


def gen_key():
    sk = SigningKey.generate()
    print("SIGNING_KEY_B64=" + base64.b64encode(bytes(sk)).decode())


def seed():
    from app.database import Base, engine, SessionLocal
    from app.models import Member, AdminUser
    from app.security.passwords import hash_password
    from sqlalchemy import select

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for code in ("STU-7K2Q-9P4M", "EMP-4H8J-2N6R", "STU-DEMO-0001"):
            db.add(Member(member_code_hash=hash_password(code), is_active=True))

        existing_admin = db.execute(select(AdminUser).where(AdminUser.username == "admin")).scalar_one_or_none()
        if not existing_admin:
            db.add(
                AdminUser(
                    username="admin",
                    password_hash=hash_password("incognito123"),
                    role="admin",
                    is_active=True,
                )
            )
        db.commit()
        print("Seeded 3 members and 1 admin (admin / incognito123).")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--gen-key", action="store_true")
    args = parser.parse_args()
    if args.gen_key:
        gen_key()
    else:
        seed()
