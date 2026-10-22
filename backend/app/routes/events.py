from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import ActivityEvent
from ..schemas import ActivityEventResponse

router = APIRouter(prefix="/projects", tags=["events"])

@router.get("/{project_id}/events", response_model=List[ActivityEventResponse])
def get_project_events(project_id: str, db: Session = Depends(get_db)):
    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.project_id == project_id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(50)
        .all()
    )
    return [ActivityEventResponse.from_orm(e) for e in events]
