from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.deps import get_db
from app.schemas import RedeemRequest, RedeemResponse
from app.services.credential_service import redeem_eligibility_code, CredentialError
from app.services.abuse_guard import check_rate_limit
from app.config import get_settings

router = APIRouter(prefix="/api/credentials", tags=["credentials"])
settings = get_settings()


@router.post("/redeem", response_model=RedeemResponse)
def redeem(payload: RedeemRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"redeem:{client}", limit=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests.")
    try:
        token, expires_in = redeem_eligibility_code(db, payload.eligibility_code)
    except CredentialError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return RedeemResponse(credential=token, expires_in=expires_in)
