from fastapi.testclient import TestClient
from app.main import app
from app.models import Member
from app.security.passwords import hash_password

client = TestClient(app)


def test_redeem_valid_and_invalid(db):
    db.add(Member(member_code_hash=hash_password("STU-VALID-9999"), is_active=True))
    db.commit()

    # Valid code
    res = client.post("/api/credentials/redeem", json={"eligibility_code": "STU-VALID-9999"})
    assert res.status_code == 200
    data = res.json()
    assert "credential" in data
    assert data["expires_in"] > 0

    # Invalid code
    res2 = client.post("/api/credentials/redeem", json={"eligibility_code": "NON-EXISTENT-CODE"})
    assert res2.status_code == 400
