from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.models import Member
from app.security.passwords import hash_password

client = TestClient(app)


def test_submit_and_track_report(db):
    db.add(Member(member_code_hash=hash_password("STU-REPORT-0001"), is_active=True))
    db.commit()

    redeem_res = client.post("/api/credentials/redeem", json={"eligibility_code": "STU-REPORT-0001"})
    assert redeem_res.status_code == 200
    token = redeem_res.json()["credential"]

    # Submit
    submit_res = client.post(
        "/api/reports",
        json={
            "credential": token,
            "company_name": "Acme Technologies",
            "category": "safety",
            "title": "Broken stair railing in library",
            "description": "The third floor east stair railing is loose and unsafe for students.",
            "severity": "medium",
        },
    )
    assert submit_res.status_code == 200
    data = submit_res.json()
    report_id = data["report_id"]
    tracking_secret = data["tracking_secret"]
    assert data["status"] == "received"
    # Verify filed_at is an accurate ISO timestamp
    filed_dt = datetime.fromisoformat(data["filed_at"])
    assert filed_dt.year >= 2026

    # Track
    track_res = client.post(
        "/api/reports/track",
        json={"report_id": report_id, "tracking_secret": tracking_secret},
    )
    assert track_res.status_code == 200
    assert track_res.json()["status"] == "received"
    assert track_res.json()["company_name"] == "Acme Technologies"

    # Track with invalid secret
    bad_track = client.post(
        "/api/reports/track",
        json={"report_id": report_id, "tracking_secret": "wrong_secret"},
    )
    assert bad_track.status_code == 404


def test_spam_submission_rejected(db):
    db.add(Member(member_code_hash=hash_password("STU-SPAM-TEST"), is_active=True))
    db.commit()

    redeem_res = client.post("/api/credentials/redeem", json={"eligibility_code": "STU-SPAM-TEST"})
    token = redeem_res.json()["credential"]

    # Submit obvious spam link
    submit_res = client.post(
        "/api/reports",
        json={
            "credential": token,
            "category": "other",
            "title": "Earn fast cash click here",
            "description": "Click here to claim free money at http://spam-site.com/giveaway now!",
            "severity": "low",
        },
    )
    assert submit_res.status_code == 400
    assert "rejected" in submit_res.json()["detail"].lower()
