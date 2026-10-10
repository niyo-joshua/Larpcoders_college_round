import pytest
from app.services.credential_service import redeem_eligibility_code, issue_blind_signature
from app.services.report_service import submit_report, ReportError
from app.security.passwords import hash_password
from app.security.blind_signatures import client_blind_helper, client_unblind_helper
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
            "title": "First incident report",
            "description": "A sufficiently long description of the incident without repetitive phrases.",
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
                "title": "Different title completely unique",
                "description": "Trying to reuse the credential for a second distinct report should fail.",
                "severity": "low",
            },
        )


def test_duplicate_incident_rejected(db):
    seed_member(db, "STU-TEST-DUP-1")
    seed_member(db, "STU-TEST-DUP-2")

    token1, _ = redeem_eligibility_code(db, "STU-TEST-DUP-1")
    token2, _ = redeem_eligibility_code(db, "STU-TEST-DUP-2")

    # First user submits
    res1 = submit_report(
        db,
        {
            "credential": token1,
            "company_name": "Acme Technologies",
            "category": "safety",
            "title": "Water leak in server room basement",
            "description": "Water leaking through ceiling panel near rack 4 forming a puddle.",
            "severity": "medium",
        },
    )
    assert res1["report_id"]

    # Second user tries to submit identical report for same company (duplicate prevention)
    with pytest.raises(ReportError) as exc_info:
        submit_report(
            db,
            {
                "credential": token2,
                "company_name": "Acme Technologies",
                "category": "safety",
                "title": "Water leak in server room basement",
                "description": "Water leaking through ceiling panel near rack 4 forming a puddle.",
                "severity": "medium",
            },
        )
    assert "Duplicate incident report" in str(exc_info.value)


def test_blind_signature_submission_and_replay(db):
    seed_member(db, "BLIND-MEMBER-001")
    tag = "ticket_secret_token_12345"

    # Step 1: Client blinds message
    from app.security.blind_signatures import get_public_key_params
    params = get_public_key_params()
    blinded_hex, r_hex = client_blind_helper(tag, params["n"], params["e"])

    # Step 2: Server blind-signs
    sign_res = issue_blind_signature(db, "BLIND-MEMBER-001", blinded_hex)

    # Step 3: Client unblinds signature
    unblinded_sig = client_unblind_helper(sign_res["blinded_signature"], r_hex, sign_res["n"])

    # Step 4: Client submits report with unblinded signature and tag
    res = submit_report(
        db,
        {
            "blind_tag": tag,
            "blind_signature": unblinded_sig,
            "category": "workplace",
            "title": "Payroll discrepancy in engineering overtime",
            "description": "Overtime hours logged during weekend maintenance were not credited.",
            "severity": "low",
        },
    )
    assert res["report_id"]

    # Step 5: Replay with same blind tag must fail
    with pytest.raises(ReportError) as exc_info:
        submit_report(
            db,
            {
                "blind_tag": tag,
                "blind_signature": unblinded_sig,
                "category": "workplace",
                "title": "Second attempt with same blind credential",
                "description": "Replaying blind token must be caught by single-use nullifier.",
                "severity": "low",
            },
        )
    assert "Credential already used" in str(exc_info.value)


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
