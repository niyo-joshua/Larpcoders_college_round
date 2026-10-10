from app.models import Report, Member


def test_report_model_has_no_identity_fields():
    """Schema-level guarantee: reports table must never carry identity columns."""
    forbidden = {"member_id", "email", "student_id", "employee_id", "credential", "tag"}
    columns = {c.name for c in Report.__table__.columns}
    assert forbidden.isdisjoint(columns), f"Report has forbidden columns: {forbidden & columns}"


def test_member_model_has_no_report_link():
    columns = {c.name for c in Member.__table__.columns}
    assert "report_id" not in columns
