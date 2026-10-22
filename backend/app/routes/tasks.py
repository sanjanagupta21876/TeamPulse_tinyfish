from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from ..database import get_db
from ..models import Task, Project, ProgressUpdate, ActivityEvent, get_utc_now
from ..schemas import TaskResponse, TaskCreate, TaskUpdate, ProgressUpdateCreate, ProgressUpdateResponse
from ..rules_engine import check_circular_dependency, DependencyCycleError, get_transitive_downstream, calculate_project_risk

router = APIRouter(tags=["tasks"])

def task_to_response(task: Task, all_tasks: List[Task]) -> TaskResponse:
    depends_on_ids = [dep.id for dep in task.dependencies]
    downstream_ids = get_transitive_downstream(task.id, all_tasks)
    
    return TaskResponse(
        id=task.id,
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        owner=task.owner,
        status=task.status,
        priority=task.priority,
        estimated_hours=task.estimated_hours,
        deadline=task.deadline,
        last_updated_hours_ago=round(task.last_updated_hours_ago, 1),
        is_overdue=task.is_overdue,
        has_blocker=task.has_blocker,
        blocker_description=task.blocker_description,
        blocker_category=task.blocker_category,
        created_at=task.created_at,
        updated_at=task.updated_at,
        depends_on_ids=depends_on_ids,
        downstream_ids=downstream_ids,
        progress_updates=[ProgressUpdateResponse.from_orm(p) for p in task.progress_updates]
    )

@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
def get_project_tasks(project_id: str, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return [task_to_response(t, tasks) for t in tasks]

@router.post("/tasks", response_model=TaskResponse)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == task_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = db.query(Task).filter(Task.id == task_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Task with ID {task_in.id} already exists")

    all_tasks = db.query(Task).filter(Task.project_id == task_in.project_id).all()

    # Validate dependencies exist
    if task_in.depends_on_ids:
        for dep_id in task_in.depends_on_ids:
            if not any(t.id == dep_id for t in all_tasks):
                raise HTTPException(status_code=400, detail=f"Dependency task '{dep_id}' not found in project")

    new_task = Task(
        id=task_in.id,
        project_id=task_in.project_id,
        title=task_in.title,
        description=task_in.description,
        owner=task_in.owner,
        status=task_in.status,
        priority=task_in.priority,
        estimated_hours=task_in.estimated_hours,
        deadline=task_in.deadline,
        last_updated_hours_ago=0.0,
        is_overdue=False,
        has_blocker=task_in.has_blocker,
        blocker_description=task_in.blocker_description,
        blocker_category=task_in.blocker_category
    )
    db.add(new_task)
    db.flush()

    if task_in.depends_on_ids:
        deps = db.query(Task).filter(Task.id.in_(task_in.depends_on_ids)).all()
        new_task.dependencies = deps

    db.commit()
    db.refresh(new_task)
    all_tasks = db.query(Task).filter(Task.project_id == task_in.project_id).all()
    return task_to_response(new_task, all_tasks)

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    all_tasks = db.query(Task).filter(Task.project_id == task.project_id).all()

    # If updating dependencies, check for circular dependencies
    if task_in.depends_on_ids is not None:
        try:
            check_circular_dependency(task.id, task_in.depends_on_ids, all_tasks)
        except DependencyCycleError as e:
            raise HTTPException(status_code=400, detail=str(e))
            
        deps = db.query(Task).filter(Task.id.in_(task_in.depends_on_ids)).all()
        task.dependencies = deps

    # Update fields
    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.owner is not None:
        task.owner = task_in.owner
    if task_in.status is not None:
        old_status = task.status
        task.status = task_in.status
        task.last_updated_hours_ago = 0.0
        # If marked completed, clear blocker
        if task_in.status == "COMPLETED":
            task.has_blocker = False
            task.blocker_description = None
    if task_in.priority is not None:
        task.priority = task_in.priority
    if task_in.estimated_hours is not None:
        task.estimated_hours = task_in.estimated_hours
    if task_in.deadline is not None:
        task.deadline = task_in.deadline
    if task_in.has_blocker is not None:
        task.has_blocker = task_in.has_blocker
    if task_in.blocker_description is not None:
        task.blocker_description = task_in.blocker_description
    if task_in.blocker_category is not None:
        task.blocker_category = task_in.blocker_category

    task.updated_at = get_utc_now()
    db.commit()
    db.refresh(task)

    # Re-evaluate project risk
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if project:
        risk = calculate_project_risk(project, all_tasks)
        project.risk_level = risk.risk_level
        db.commit()

    all_tasks = db.query(Task).filter(Task.project_id == task.project_id).all()
    return task_to_response(task, all_tasks)

@router.post("/tasks/{task_id}/progress", response_model=ProgressUpdateResponse)
def add_progress_update(task_id: str, update_in: ProgressUpdateCreate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    prog = ProgressUpdate(
        task_id=task.id,
        author=update_in.author,
        content=update_in.content,
        status_change=update_in.status_change
    )
    task.last_updated_hours_ago = 0.0
    if update_in.status_change:
        task.status = update_in.status_change

    db.add(prog)
    db.commit()
    db.refresh(prog)
    return ProgressUpdateResponse.from_orm(prog)
