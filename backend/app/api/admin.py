import base64
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.deps import get_db
from app.models import AdminUser
from app.schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    ReportView,
    UpdateReportRequest,
)
from app.services.admin_service import (
    authenticate,
    list_reports,
    get_report,
    update_report,
    get_analytics,
    AdminError,
)
from app.security.tokens import sign

router = APIRouter(prefix="/api/admin", tags=["admin"])

# In-memory session store. Use Redis + JWT in production.
_sessions: dict[str, str] = {}


def require_admin(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> AdminUser:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token.")
    token = authorization.split(" ", 1)[1]
    username = _sessions.get(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token.")
    u = db.execute(select(AdminUser).where(AdminUser.username == username)).scalar_one_or_none()
    if u is None or not u.is_active:
        raise HTTPException(status_code=401, detail="Invalid token.")
    return u


@router.post("/login", response_model=AdminLoginResponse)
def login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate(db, payload.username, payload.password)
    except AdminError:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = base64.urlsafe_b64encode(sign(f"{user.id}:{user.username}".encode())).decode()
    _sessions[token] = user.username
    return AdminLoginResponse(token=token, user={"username": user.username, "role": user.role})


@router.get("/reports", response_model=list[ReportView])
def list_all(
    status: str = "",
    category: str = "",
    db: Session = Depends(get_db),
    _: AdminUser = Depends(require_admin),
):
    return list_reports(db, status=status or None, category=category or None)


@router.get("/reports/{report_id}", response_model=ReportView)
def get_one(
    report_id: str,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(require_admin),
):
    try:
        return get_report(db, report_id)
    except AdminError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/reports/{report_id}", response_model=ReportView)
def patch_one(
    report_id: str,
    payload: UpdateReportRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_admin),
):
    try:
        return update_report(db, admin, report_id, payload.model_dump(exclude_none=True))
    except AdminError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/analytics")
def analytics(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(require_admin),
):
    return get_analytics(db)
