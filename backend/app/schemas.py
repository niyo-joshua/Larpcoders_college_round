from pydantic import BaseModel, Field


class RedeemRequest(BaseModel):
    eligibility_code: str = Field(min_length=4, max_length=128)


class RedeemResponse(BaseModel):
    credential: str
    expires_in: int


class SubmitReportRequest(BaseModel):
    credential: str
    category: str
    title: str
    description: str
    severity: str


class SubmitReportResponse(BaseModel):
    report_id: str
    tracking_secret: str
    status: str


class TrackRequest(BaseModel):
    report_id: str
    tracking_secret: str


class TrackResponse(BaseModel):
    status: str
    updated_at: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    user: dict


class ReportView(BaseModel):
    id: str
    category: str
    title: str
    description: str
    severity: str
    status: str
    created_at: str
    updated_at: str
    moderator_note: str = ""


class UpdateReportRequest(BaseModel):
    status: str | None = None
    moderator_note: str | None = None
