from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.platform_settings import PlatformSettings

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/public")
def public_settings(db: Session = Depends(get_db)):
    """Non-secret flags for the frontend (no auth)."""
    row = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    enabled = True if row is None else bool(row.student_analytics_enabled)
    return {"student_analytics_enabled": enabled}
