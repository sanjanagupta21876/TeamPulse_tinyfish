import datetime
import json
from sqlalchemy.orm import Session
from .models import Project, Task, ProgressUpdate, ActivityEvent, RecoveryPlan, ResearchSource, VerificationOutcome, get_utc_now

DEMO_PROJECT_ID = "hackathon-app-2026"

def seed_demo_data(db: Session, force_reset: bool = False):
    """
    Seeds the primary hackathon demo scenario idempotently.
    If force_reset=True, wipes existing demo data and restores pristine initial state.
    """
    existing_project = db.query(Project).filter(Project.id == DEMO_PROJECT_ID).first()
    if existing_project and not force_reset:
        return existing_project

    if existing_project and force_reset:
        # Wipe all records for this project
        db.query(ActivityEvent).filter(ActivityEvent.project_id == DEMO_PROJECT_ID).delete()
        db.query(ResearchSource).filter(ResearchSource.project_id == DEMO_PROJECT_ID).delete()
        db.query(VerificationOutcome).filter(VerificationOutcome.plan_id.in_(
            db.query(RecoveryPlan.id).filter(RecoveryPlan.project_id == DEMO_PROJECT_ID)
        )).delete(synchronize_session=False)
        db.query(RecoveryPlan).filter(RecoveryPlan.project_id == DEMO_PROJECT_ID).delete()
        
        # Delete progress updates and tasks
        tasks = db.query(Task).filter(Task.project_id == DEMO_PROJECT_ID).all()
        for t in tasks:
            t.dependencies = []
            db.query(ProgressUpdate).filter(ProgressUpdate.task_id == t.id).delete()
        db.flush()
        db.query(Task).filter(Task.project_id == DEMO_PROJECT_ID).delete()
        db.query(Project).filter(Project.id == DEMO_PROJECT_ID).delete()
        db.commit()

    now = datetime.datetime.now(datetime.timezone.utc)
    # Deadline: exactly 6 hours from now
    project_deadline = now + datetime.timedelta(hours=6)

    project = Project(
        id=DEMO_PROJECT_ID,
        name="Hackathon App — Live Collab Canvas",
        description="Real-time multi-agent collaborative workspace for Kritical Hacks 2026. Submission deadline in 6 hours.",
        deadline=project_deadline,
        risk_level="HIGH"
    )
    db.add(project)
    db.flush()

    # 1. TASK-101: Backend API (BLOCKED, OVERDUE, 20 hours stale)
    backend_deadline = now - datetime.timedelta(hours=2) # overdue
    task101 = Task(
        id="TASK-101",
        project_id=project.id,
        title="Backend REST API Endpoints",
        description="Core REST endpoints for session creation, canvas sync, and persistence state.",
        owner="Alex (Backend Lead)",
        status="BLOCKED",
        priority="CRITICAL",
        estimated_hours=3.0,
        deadline=backend_deadline,
        last_updated_hours_ago=20.0,
        is_overdue=True,
        has_blocker=True,
        blocker_description="API integration is failing because the API contract is unclear.",
        blocker_category="Unclear requirements or API contract"
    )

    # 2. TASK-102: Frontend Integration (WAITING for Backend API)
    frontend_deadline = now + datetime.timedelta(hours=3)
    task102 = Task(
        id="TASK-102",
        project_id=project.id,
        title="Frontend API Integration & State Wiring",
        description="Wire React canvas components to live REST API endpoints and state manager.",
        owner="Maya (Frontend Lead)",
        status="WAITING",
        priority="HIGH",
        estimated_hours=2.5,
        deadline=frontend_deadline,
        last_updated_hours_ago=2.0,
        is_overdue=False,
        has_blocker=False,
        blocker_description=None,
        blocker_category=None
    )

    # 3. TASK-103: Testing (BLOCKED by Frontend Integration)
    qa_deadline = now + datetime.timedelta(hours=5)
    task103 = Task(
        id="TASK-103",
        project_id=project.id,
        title="E2E Testing & Integration Validation",
        description="Automated end-to-end integration test suite and demo flight check.",
        owner="Devon (QA / Fullstack)",
        status="BLOCKED",
        priority="HIGH",
        estimated_hours=1.5,
        deadline=qa_deadline,
        last_updated_hours_ago=4.0,
        is_overdue=False,
        has_blocker=True,
        blocker_description="Blocked waiting for Frontend API Integration to deliver runnable client.",
        blocker_category="Dependency blockage"
    )

    # 4. TASK-104: Presentation & Pitch Deck (NOT STARTED, Independent)
    pitch_deadline = now + datetime.timedelta(hours=5, minutes=30)
    task104 = Task(
        id="TASK-104",
        project_id=project.id,
        title="Presentation Slides & Video Demo Script",
        description="Prepare pitch slides, video recording script, and product demo walkthrough.",
        owner="Sarah (Product / Pitch Lead)",
        status="NOT_STARTED",
        priority="MEDIUM",
        estimated_hours=2.0,
        deadline=pitch_deadline,
        last_updated_hours_ago=1.0,
        is_overdue=False,
        has_blocker=False,
        blocker_description=None,
        blocker_category=None
    )

    db.add_all([task101, task102, task103, task104])
    db.flush()

    # Set up dependency chain:
    # TASK-102 depends on TASK-101
    task102.dependencies.append(task101)
    # TASK-103 depends on TASK-102
    task103.dependencies.append(task102)
    # TASK-104 has NO dependencies (independent)

    db.flush()

    # Add initial progress logs
    p1 = ProgressUpdate(
        task_id=task101.id,
        author="Alex (Backend Lead)",
        content="Attempted initial endpoint handler for canvas session, but frontend JSON payload expectations don't match our database schema.",
        status_change="BLOCKED",
        created_at=now - datetime.timedelta(hours=20)
    )
    p2 = ProgressUpdate(
        task_id=task102.id,
        author="Maya (Frontend Lead)",
        content="Canvas components ready in isolation. Blocked waiting for stable API endpoint contract from Alex.",
        status_change="WAITING",
        created_at=now - datetime.timedelta(hours=2)
    )
    db.add_all([p1, p2])

    # Initial Activity Events
    e1 = ActivityEvent(
        project_id=project.id,
        event_type="RISK_DETECTED",
        title="High Project Risk Detected",
        description="Critical dependency bottleneck on TASK-101 holding up 2 downstream tasks with 6h remaining.",
        metadata_json=json.dumps({"risk_level": "HIGH", "score": 90}),
        created_at=now - datetime.timedelta(minutes=15)
    )
    e2 = ActivityEvent(
        project_id=project.id,
        event_type="DEPENDENCY_CHAIN_IDENTIFIED",
        title="Dependency Chain Identified",
        description="Bottleneck: TASK-101 (Backend API) -> TASK-102 (Frontend Integration) -> TASK-103 (Testing).",
        metadata_json=json.dumps({"root_blocker": "TASK-101", "impacted_count": 2}),
        created_at=now - datetime.timedelta(minutes=14)
    )
    db.add_all([e1, e2])

    db.commit()
    db.refresh(project)
    return project
