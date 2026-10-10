from pydantic import BaseModel, Field


class SendOtpRequest(BaseModel):
    phone_number: str = Field(min_length=7, max_length=32)



class SendOtpResponse(BaseModel):
    message: str
    demo_otp: str
    phone_number: str


class VerifyOtpRequest(BaseModel):
    phone_number: str = Field(min_length=7, max_length=32)
    otp_code: str = Field(min_length=4, max_length=10)


class VerifyOtpResponse(BaseModel):
    credential: str
    expires_in: int
    blind_issuance_available: bool = True
    phone_number: str


class RedeemRequest(BaseModel):
    eligibility_code: str | None = None
    phone_number: str | None = None
    otp_code: str | None = None


class RedeemResponse(BaseModel):
    credential: str
    expires_in: int
    blind_issuance_available: bool = True
    phone_number: str | None = None


class BlindSignRequest(BaseModel):
    eligibility_code: str | None = None
    phone_number: str | None = None
    otp_code: str | None = None
    blinded_message: str = Field(min_length=10)


class BlindSignResponse(BaseModel):
    blinded_signature: str
    n: str
    e: str


class SubmitReportRequest(BaseModel):
    # Support both classic signed token and zero-knowledge blind signature
    credential: str | None = None
    blind_tag: str | None = None
    blind_signature: str | None = None
    reporter_phone: str | None = None

    company_name: str = "Acme Technologies"
    category: str
    title: str
    description: str
    severity: str


class SubmitReportResponse(BaseModel):
    report_id: str
    tracking_secret: str
    status: str
    company_name: str
    filed_at: str
    is_spam: bool
    harm_score: int
    harm_flags: list[str]
    reporter_phone: str | None = None


class TrackRequest(BaseModel):
    report_id: str
    tracking_secret: str


class TrackResponse(BaseModel):
    report_id: str
    company_name: str
    category: str
    title: str
    status: str
    filed_at: str
    updated_at: str
    ombudsman_intervention: bool
    executive_summary: str
    moderator_note: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    user: dict


class ReportView(BaseModel):
    id: str
    company_name: str
    category: str
    title: str
    description: str
    executive_summary: str
    severity: str
    status: str
    filed_at: str
    updated_at: str
    is_spam: bool
    harm_score: int
    harm_flags: list[str]
    ombudsman_intervention: bool
    intervention_reason: str = ""
    whistleblower_safety_level: str = "protected_escrow"
    moderator_note: str = ""
    reporter_phone: str | None = None


class CompanyReportView(BaseModel):
    id: str
    company_name: str
    category: str
    title: str
    severity: str
    status: str
    filed_at: str
    executive_summary: str
    ombudsman_intervention: bool


class UpdateReportRequest(BaseModel):
    status: str | None = None
    executive_summary: str | None = None
    moderator_note: str | None = None
    ombudsman_intervention: bool | None = None
    intervention_reason: str | None = None
    whistleblower_safety_level: str | None = None
