from fastapi.testclient import TestClient
from app.main import app
from app.models import AdminUser, Member
from app.security.passwords import hash_password

client = TestClient(app)


def test_admin_auth_and_moderation(db):
    db.add(AdminUser(username="testadmin", password_hash=hash_password("adminpass123"), role="admin", is_active=True))
    db.add(Member(member_code_hash=hash_password("STU-ADMIN-TEST"), is_active=True))
    db.commit()

    # Unauthorized access
    unauth = client.get("/api/admin/reports")
    assert unauth.status_code == 401

    # Login
    login_res = client.post("/api/admin/login", json={"username": "testadmin", "password": "adminpass123"})
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit a report first
    redeem_res = client.post("/api/credentials/redeem", json={"eligibility_code": "STU-ADMIN-TEST"})
    cred = redeem_res.json()["credential"]
    sub_res = client.post(
        "/api/reports",
        json={
            "credential": cred,
            "category": "academic",
            "title": "Grading irregularity in physics",
            "description": "Grading rubric was not applied according to course syllabus guidelines.",
            "severity": "low",
        },
    )
    report_id = sub_res.json()["report_id"]

    # Admin list reports
    list_res = client.get("/api/admin/reports", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1

    # Admin get single report
    get_res = client.get(f"/api/admin/reports/{report_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == report_id

    # Admin patch report
    patch_res = client.patch(
        f"/api/admin/reports/{report_id}",
        json={"status": "under_review", "moderator_note": "Investigating with department head."},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "under_review"
    assert patch_res.json()["moderator_note"] == "Investigating with department head."

    # Admin analytics
    analytics_res = client.get("/api/admin/analytics", headers=headers)
    assert analytics_res.status_code == 200
    assert analytics_res.json()["total"] >= 1
