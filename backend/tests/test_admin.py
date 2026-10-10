from fastapi.testclient import TestClient
from app.main import app
from app.models import AdminUser, Member
from app.security.passwords import hash_password

client = TestClient(app)


def test_admin_auth_and_moderation(db):
    db.add(AdminUser(username="testadmin", password_hash=hash_password("adminpass123"), role="ombudsman", is_active=True))
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
            "company_name": "Apex Logistics",
            "category": "safety",
            "title": "Forklift maintenance logs omitted",
            "description": "Forklift #3 hydraulic brake pressure is dropping below safety thresholds without service.",
            "severity": "high",
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
    assert "Forklift" in get_res.json()["description"]

    # Admin patch report and create sanitized executive summary
    patch_res = client.patch(
        f"/api/admin/reports/{report_id}",
        json={
            "status": "under_review",
            "executive_summary": "Warehouse logistics team alerted to inspect vehicle hydraulic pressures immediately.",
            "moderator_note": "Investigating with facility manager under escrow.",
            "ombudsman_intervention": True,
            "intervention_reason": "Occupational safety risk requiring immediate independent inspection.",
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "under_review"
    assert patch_res.json()["ombudsman_intervention"] is True

    # Company Briefing test (Company NEVER sees raw description)
    company_res = client.get("/api/admin/company/Apex Logistics", headers=headers)
    assert company_res.status_code == 200
    company_reports = company_res.json()
    assert len(company_reports) == 1
    assert "description" not in company_reports[0]  # Verify confidential raw narrative is excluded!
    assert "hydraulic" in company_reports[0]["executive_summary"]

    # Admin analytics
    analytics_res = client.get("/api/admin/analytics", headers=headers)
    assert analytics_res.status_code == 200
    assert analytics_res.json()["total"] >= 1
    assert analytics_res.json()["critical_interventions"] >= 1
