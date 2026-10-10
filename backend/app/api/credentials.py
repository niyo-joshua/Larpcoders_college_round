from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.deps import get_db
from app.schemas import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    RedeemRequest,
    RedeemResponse,
    BlindSignRequest,
    BlindSignResponse,
)
from app.services.credential_service import (
    send_phone_verification_code,
    verify_phone_otp,
    issue_blind_signature_with_phone,
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


@router.post("/send-otp", response_model=SendOtpResponse)
def send_otp(payload: SendOtpRequest, request: Request, db: Session = Depends(get_db)):
    """Request a 6-digit phone verification code via SMS."""
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"otp:{client}", limit=15, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many verification attempts.")
    try:
        data = send_phone_verification_code(db, payload.phone_number)
        return SendOtpResponse(**data)
    except CredentialError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(payload: VerifyOtpRequest, request: Request, db: Session = Depends(get_db)):
    """Verify 6-digit SMS OTP and receive single-use report submission credential."""
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"verify_otp:{client}", limit=20, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many verification attempts.")
    try:
        token, expires_in = verify_phone_otp(db, payload.phone_number, payload.otp_code)
        return VerifyOtpResponse(
            credential=token,
            expires_in=expires_in,
            blind_issuance_available=True,
            phone_number=payload.phone_number.strip(),
        )
    except CredentialError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/redeem", response_model=RedeemResponse)
def redeem(payload: RedeemRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"redeem:{client}", limit=15, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many redemption attempts.")
    try:
        if payload.phone_number and payload.otp_code:
            token, expires_in = verify_phone_otp(db, payload.phone_number, payload.otp_code)
            return RedeemResponse(
                credential=token,
                expires_in=expires_in,
                blind_issuance_available=True,
                phone_number=payload.phone_number.strip(),
            )
        elif payload.eligibility_code:
            token, expires_in = redeem_eligibility_code(db, payload.eligibility_code)
            return RedeemResponse(credential=token, expires_in=expires_in, blind_issuance_available=True)
        else:
            raise CredentialError("Please provide phone_number and otp_code.")
    except CredentialError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/blind-sign", response_model=BlindSignResponse)
def blind_sign(payload: BlindSignRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"blind_sign:{client}", limit=15, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many blind sign attempts.")
    try:
        if payload.phone_number and payload.otp_code:
            result = issue_blind_signature_with_phone(
                db, payload.phone_number, payload.otp_code, payload.blinded_message
            )
        elif payload.eligibility_code:
            result = issue_blind_signature(db, payload.eligibility_code, payload.blinded_message)
        else:
            raise CredentialError("Please verify your phone number and OTP code.")
    except CredentialError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BlindSignResponse(**result)

