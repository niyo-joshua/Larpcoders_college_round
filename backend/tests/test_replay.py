import pytest
from app.services.credential_service import redeem_eligibility_code
from app.services.report_service import submit_report, ReportError
from app.security.passwords import hash_password
from app.models import Member


def seed_member(db, code="STU-TEST-0001"):
    db.add(Member(member_code_hash=hash_password(code), is_active=True))
    db.commit()


def test_replay_rejected(db):
    seed_member(db)
    token, _ = redeem_eligibility_code(db, "STU-TEST-0001")
    # First submission succeeds.
    result = submit_report(
        db,
        {
            "credential": token,
            "category": "misconduct",
            "title": "Test title",
            "description": "A sufficiently long description of the incident.",
            "severity": "low",
        },
    )
    assert result["report_id"]

    # Second submission with the same credential must fail.
    with pytest.raises(ReportError):
        submit_report(
            db,
            {
                "credential": token,
                "category": "misconduct",
                "title": "Second attempt",
                "description": "Trying to reuse the credential should be rejected.",
                "severity": "low",
            },
        )


def test_forged_credential_rejected(db):
    with pytest.raises(ReportError):
        submit_report(
            db,
            {
                "credential": "not.a.real.credential",
                "category": "misconduct",
                "title": "Forged attempt",
                "description": "This should not be accepted by the server.",
                "severity": "low",
            },
        )
