import argparse
import base64
from datetime import datetime, timedelta
from nacl.signing import SigningKey


def gen_key():
    sk = SigningKey.generate()
    print("SIGNING_KEY_B64=" + base64.b64encode(bytes(sk)).decode())


def seed():
    from app.database import Base, engine, SessionLocal
    from app.models import AdminUser, Company, Report, PhoneVerification
    from app.security.passwords import hash_password
    from app.security.tokens import sha256_hex
    from sqlalchemy import select

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Companies
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

        # 2. Seed Admin and Moderator accounts
        users = [
            ("admin", "incognito123", "admin"),
            ("moderator", "moderator123", "moderator"),
        ]
        for username, pwd, role in users:
            existing_user = db.execute(select(AdminUser).where(AdminUser.username == username)).scalar_one_or_none()
            if not existing_user:
                db.add(
                    AdminUser(
                        username=username,
                        password_hash=hash_password(pwd),
                        role=role,
                        is_active=True,
                    )
                )
            else:
                existing_user.password_hash = hash_password(pwd)
                existing_user.role = role

        # 3. Seed Phone Verification Demo Record
        demo_phones = ["+1 (555) 019-2834", "+1 (555) 014-8821", "+1 (555) 017-9932"]
        for p in demo_phones:
            existing_pv = db.execute(select(PhoneVerification).where(PhoneVerification.phone_number == p)).scalar_one_or_none()
            if not existing_pv:
                db.add(
                    PhoneVerification(
                        phone_number=p,
                        otp_code="123456",
                        expires_at=datetime.utcnow() + timedelta(days=365),
                        is_verified=True,
                    )
                )

        # 4. Seed Rich Demo Reports
        demo_reports = [
            {
                "company_name": "Acme Technologies",
                "title": "Critical Battery Overheating & Falsified Safety Testing Logs",
                "category": "safety",
                "severity": "high",
                "status": "under_review",
                "description": "During stress-testing cycle 14, three battery modules entered thermal runaway. Engineering leadership instructed testing technicians to falsify heat logs and push shipment dates rather than halt manufacturing.",
                "executive_summary": "[SANITIZED OMBUDSMAN SUMMARY FOR ACME TECHNOLOGIES]\nCategory: SAFETY\nConcern: Independent report received regarding high-temperature server rack thermal incidents and alleged log modifications during testing cycles. Ombudsman recommends immediate internal engineering review.",
                "reporter_phone": "+1 (555) 234-5678",
                "harm_score": 85,
                "harm_flags": "safety_critical",
                "ombudsman_intervention": True,
                "intervention_reason": "High risk of thermal runaway and battery failure in enterprise hardware. Urgent engineering audit requested.",
                "days_ago": 3,
            },
            {
                "company_name": "Apex Logistics",
                "title": "Unpaid Mandatory Overtime & Timecard Alterations in West Terminal",
                "category": "workplace",
                "severity": "medium",
                "status": "company_notified",
                "description": "Shift supervisors in West Terminal dock B have been manually editing digital timecards to cap hourly workers at 39.5 hours while forcing an additional 8 hours of Saturday loading shifts without recording pay.",
                "executive_summary": "[SANITIZED OMBUDSMAN SUMMARY FOR APEX LOGISTICS]\nCategory: WORKPLACE\nConcern: Documented discrepancies regarding digital hourly timecard editing and weekend loading shifts in West Terminal. Operational payroll audit requested.",
                "reporter_phone": "+1 (555) 345-6789",
                "harm_score": 40,
                "harm_flags": "corporate_fraud",
                "ombudsman_intervention": False,
                "intervention_reason": "",
                "days_ago": 5,
            },
            {
                "company_name": "Nova Health Systems",
                "title": "Sterilization Protocols Bypassed for Single-Use Laparoscopic Sensor Packs",
                "category": "safety",
                "severity": "high",
                "status": "investigation_active",
                "description": "Surgical ward 4 has experienced repeated shortages of sterile disposable laparoscopic sensor caps. Orderly staff were ordered by ward manager to chemically soak single-use caps and repackage them for re-use on active surgical patients.",
                "executive_summary": "[SANITIZED OMBUDSMAN SUMMARY FOR NOVA HEALTH SYSTEMS]\nCategory: SAFETY\nConcern: Urgent inquiry into clinical sterilization protocols and single-use laparoscopic sensor repackaging in Ward 4.",
                "reporter_phone": "+1 (555) 456-7890",
                "harm_score": 95,
                "harm_flags": "safety_critical,threat_violence",
                "ombudsman_intervention": True,
                "intervention_reason": "Direct clinical patient hazard identified. Immediate regulatory health authority notified by Ombudsman.",
                "days_ago": 1,
            },
            {
                "company_name": "Global Finance Corp",
                "title": "Managing Director Insider Liquidation Prior to Trading Loss Disclosure",
                "category": "misconduct",
                "severity": "high",
                "status": "received",
                "description": "Managing Director in Quantitative Strategies liquidated personal holding shares 72 hours before an internal executive presentation revealing a 42 million dollar algorithmic execution error.",
                "executive_summary": "[SANITIZED OMBUDSMAN SUMMARY FOR GLOBAL FINANCE CORP]\nCategory: MISCONDUCT\nConcern: Allegations of executive securities liquidation ahead of internal algorithmic execution loss disclosure.",
                "reporter_phone": "+1 (555) 567-8901",
                "harm_score": 70,
                "harm_flags": "corporate_fraud",
                "ombudsman_intervention": False,
                "intervention_reason": "",
                "days_ago": 2,
            },
            {
                "company_name": "Acme Technologies",
                "title": "Systemic Retaliatory Territory Demotions by Regional Sales Leadership",
                "category": "harassment",
                "severity": "medium",
                "status": "resolved",
                "description": "Regional sales director engaged in persistent verbal abuse and retaliatory territory demotions against junior associates who questioned irregular customer rebates.",
                "executive_summary": "[SANITIZED OMBUDSMAN SUMMARY FOR ACME TECHNOLOGIES]\nCategory: HARASSMENT\nConcern: Formal investigation concluded regarding hostile conduct and territory assignments in regional sales division. Corrective managerial action executed.",
                "reporter_phone": "+1 (555) 678-9012",
                "harm_score": 30,
                "harm_flags": "severe_harassment",
                "ombudsman_intervention": False,
                "intervention_reason": "",
                "days_ago": 8,
            },
        ]

        for r_data in demo_reports:
            existing_report = db.execute(
                select(Report).where(
                    Report.title == r_data["title"],
                    Report.company_name == r_data["company_name"]
                )
            ).scalar_one_or_none()

            filed_time = datetime.utcnow() - timedelta(days=r_data["days_ago"], hours=3, minutes=15)
            secret = f"demo_secret_{r_data['company_name'][:4].lower()}_{r_data['category']}"

            if not existing_report:
                report = Report(
                    company_name=r_data["company_name"],
                    tracking_secret_hash=sha256_hex(secret),
                    duplicate_fingerprint=sha256_hex(f"{r_data['company_name']}_{r_data['title']}"),
                    category=r_data["category"],
                    title=r_data["title"],
                    description=r_data["description"],
                    executive_summary=r_data["executive_summary"],
                    severity=r_data["severity"],
                    status=r_data["status"],
                    is_spam=False,
                    harm_score=r_data["harm_score"],
                    harm_flags=r_data["harm_flags"],
                    ombudsman_intervention=r_data["ombudsman_intervention"],
                    intervention_reason=r_data["intervention_reason"],
                    whistleblower_safety_level="protected_escrow",
                    reporter_phone=r_data["reporter_phone"],
                    filed_at=filed_time,
                    updated_at=filed_time + timedelta(hours=2),
                )
                db.add(report)

        db.commit()
        print("Successfully seeded companies, demo accounts, and realistic demo reports:")
        print("  - Admin: admin / incognito123 (Role: admin, Phone numbers masked)")
        print("  - Moderator: moderator / moderator123 (Role: moderator, Phone numbers visible)")
        print(f"  - Demo reports: {len(demo_reports)} reports across 4 organizations.")
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
