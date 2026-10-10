from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.deps import get_db
from app.schemas import (
    SubmitReportRequest,
    SubmitReportResponse,
    TrackRequest,
    TrackResponse,
)
from app.services.report_service import submit_report, track_report, ReportError
from app.services.abuse_guard import check_rate_limit

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("", response_model=SubmitReportResponse)
def create(payload: SubmitReportRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"submit:{client}", limit=20, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests.")
    try:
        result = submit_report(db, payload.model_dump())
    except ReportError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return SubmitReportResponse(**result)


@router.post("/track", response_model=TrackResponse)
def track(payload: TrackRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"track:{client}", limit=30, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests.")
    try:
        return TrackResponse(**track_report(db, payload.report_id, payload.tracking_secret))
    except ReportError as e:
        raise HTTPException(status_code=404, detail=str(e))
