import argparse
import base64
from nacl.signing import SigningKey


def gen_key():
    sk = SigningKey.generate()
    print("SIGNING_KEY_B64=" + base64.b64encode(bytes(sk)).decode())


def seed():
    from app.database import Base, engine, SessionLocal
    from app.models import Member, AdminUser, Company
    from app.security.passwords import hash_password
    from sqlalchemy import select

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed Companies
        companies = [
            ("Acme Technologies", "Technology & Cloud Services"),
            ("Apex Logistics", "Warehousing & Supply Chain"),
            ("Nova Health Systems", "Healthcare & Clinical Operations"),
            ("Global Finance Corp", "Financial Services & Banking"),
        ]
        for name, ind in companies:
            existing_comp = db.execute(select(Company).where(Company.name == name)).scalar_one_or_none()
            if not existing_comp:
                db.add(Company(name=name, industry=ind, is_active=True))

        # Seed Members
        member_codes = [
            ("STU-7K2Q-9P4M", "Acme Technologies"),
            ("EMP-4H8J-2N6R", "Apex Logistics"),
            ("STU-DEMO-0001", "Nova Health Systems"),
            ("CORP-SAFE-2026", "Global Finance Corp"),
        ]
        for code, comp in member_codes:
            db.add(Member(member_code_hash=hash_password(code), company_name=comp, is_active=True))

        # Seed Ombudsman Admin
        existing_admin = db.execute(select(AdminUser).where(AdminUser.username == "admin")).scalar_one_or_none()
        if not existing_admin:
            db.add(
                AdminUser(
                    username="admin",
                    password_hash=hash_password("incognito123"),
                    role="ombudsman",
                    is_active=True,
                )
            )
        db.commit()
        print("Seeded companies, members, and Ombudsman admin (admin / incognito123).")
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
