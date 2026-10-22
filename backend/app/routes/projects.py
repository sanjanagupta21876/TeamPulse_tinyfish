from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from ..database import get_db
from ..models import Project, Task, ActivityEvent
from ..schemas import ProjectResponse, RiskAssessment
from ..rules_engine import calculate_project_risk
from ..seed_data import seed_demo_data, DEMO_PROJECT_ID

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    if not projects:
        seed_demo_data(db)
        projects = db.query(Project).all()
        
    result = []
    now = datetime.now(timezone.utc)
    for p in projects:
        deadline_tz = p.deadline.replace(tzinfo=timezone.utc) if p.deadline.tzinfo is None else p.deadline
        hours_remaining = max(0.0, (deadline_tz - now).total_seconds() / 3600.0)
        tasks_count = len(p.tasks)
        blocked_count = sum(1 for t in p.tasks if t.status == "BLOCKED" or t.has_blocker)
        result.append(ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            deadline=p.deadline,
            risk_level=p.risk_level,
            hours_remaining=round(hours_remaining, 1),
            created_at=p.created_at,
            updated_at=p.updated_at,
            tasks_count=tasks_count,
            blocked_count=blocked_count
        ))
    return result

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        if project_id == DEMO_PROJECT_ID:
            project = seed_demo_data(db)
        else:
            raise HTTPException(status_code=404, detail="Project not found")

    now = datetime.now(timezone.utc)
    deadline_tz = project.deadline.replace(tzinfo=timezone.utc) if project.deadline.tzinfo is None else project.deadline
    hours_remaining = max(0.0, (deadline_tz - now).total_seconds() / 3600.0)
    tasks_count = len(project.tasks)
    blocked_count = sum(1 for t in project.tasks if t.status == "BLOCKED" or t.has_blocker)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        deadline=project.deadline,
        risk_level=project.risk_level,
        hours_remaining=round(hours_remaining, 1),
        created_at=project.created_at,
        updated_at=project.updated_at,
        tasks_count=tasks_count,
        blocked_count=blocked_count
    )

@router.post("/{project_id}/analyze", response_model=RiskAssessment)
def analyze_project_risk(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    risk = calculate_project_risk(project, tasks)

    # Persist calculated risk level
    if project.risk_level != risk.risk_level:
        project.risk_level = risk.risk_level
        db.commit()

    return risk

@router.post("/reset-demo")
def reset_demo(db: Session = Depends(get_db)):
    """
    Restores the clean demo state for Hackathon App.
    """
    project = seed_demo_data(db, force_reset=True)
    return {"message": "Demo scenario reset successfully to pristine state", "project_id": project.id}
