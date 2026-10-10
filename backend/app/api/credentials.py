from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.deps import get_db
from app.schemas import (
    RedeemRequest,
    RedeemResponse,
    BlindSignRequest,
    BlindSignResponse,
)
from app.services.credential_service import (
    redeem_eligibility_code,
    issue_blind_signature,
    CredentialError,
)
from app.security.blind_signatures import get_public_key_params
from app.services.abuse_guard import check_rate_limit

router = APIRouter(prefix="/api/credentials", tags=["credentials"])


@router.get("/public-key")
def get_blind_public_key():
    """Return the RSA public key parameters for client-side blind signatures."""
    return get_public_key_params()


@router.post("/redeem", response_model=RedeemResponse)
def redeem(payload: RedeemRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"redeem:{client}", limit=15, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many redemption attempts.")
    try:
        token, expires_in = redeem_eligibility_code(db, payload.eligibility_code)
    except CredentialError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return RedeemResponse(credential=token, expires_in=expires_in, blind_issuance_available=True)


@router.post("/blind-sign", response_model=BlindSignResponse)
def blind_sign(payload: BlindSignRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"blind_sign:{client}", limit=15, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many blind sign attempts.")
    try:
        result = issue_blind_signature(db, payload.eligibility_code, payload.blinded_message)
    except CredentialError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BlindSignResponse(**result)
