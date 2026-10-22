import asyncio
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Project, Task, RecoveryPlan, VerificationOutcome
from app.seed_data import seed_demo_data, DEMO_PROJECT_ID
from app.recovery_engine import recovery_engine
from app.rules_engine import calculate_project_risk

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()

def test_end_to_end_adaptive_recovery_loop(test_db):
    async def _test():
        # 1. Seed demo scenario
        project = seed_demo_data(test_db, force_reset=True)
        assert project.id == DEMO_PROJECT_ID

        tasks = test_db.query(Task).filter(Task.project_id == project.id).all()
        assert len(tasks) == 4

        task101 = next(t for t in tasks if t.id == "TASK-101")
        task102 = next(t for t in tasks if t.id == "TASK-102")
        task103 = next(t for t in tasks if t.id == "TASK-103")

        assert task101.status == "BLOCKED"
        assert task102.status == "WAITING"
        assert task103.status == "BLOCKED"

        # Initial risk assessment
        risk = calculate_project_risk(project, tasks)
        assert risk.risk_level == "HIGH"

        # 2. Generate Plan (Iteration 1)
        plan1 = await recovery_engine.generate_plan(
            project=project,
            task=task101,
            all_tasks=tasks,
            db=test_db
        )
        assert plan1.iteration == 1
        assert "Mock Server" in plan1.title or "Contract" in plan1.title
        assert plan1.status == "PROPOSED"
        assert len(plan1.sources) > 0

        # 3. Approve Plan 1
        approved_plan1 = recovery_engine.approve_plan(plan1, test_db)
        assert approved_plan1.status == "APPROVED"

        # 4. First Follow-up: Intervention did not completely fix problem (STILL_BLOCKED)
        verification1 = await recovery_engine.handle_verification(
            plan=approved_plan1,
            outcome_type="STILL_BLOCKED",
            notes="The API contract is documented, but the real integration is still failing with schema mismatches and 422 Unprocessable Entity.",
            db=test_db
        )
        assert verification1["resolved"] is False
        plan2 = verification1["next_plan"]
        assert plan2 is not None
        assert plan2.iteration == 2

        # ADAPTIVE CHECK: Plan 2 must NOT repeat the contract recommendation;
        # it must adapt to schema validation / integration testing!
        assert "Schema Validation" in plan2.title or "Integration Testing" in plan2.title
        assert plan1.status == "SUPERSEDED"

        # 5. Approve Plan 2
        approved_plan2 = recovery_engine.approve_plan(plan2, test_db)
        assert approved_plan2.status == "APPROVED"

        # 6. Second Follow-up: Successful resolution (RESOLVED)
        verification2 = await recovery_engine.handle_verification(
            plan=approved_plan2,
            outcome_type="RESOLVED",
            notes="Payload schemas aligned, integration test passing with HTTP 200.",
            db=test_db
        )
        assert verification2["resolved"] is True

        # 7. Check that TASK-101 is now COMPLETED, and downstream TASK-102 unblocked to IN_PROGRESS
        test_db.refresh(task101)
        test_db.refresh(task102)
        assert task101.status == "COMPLETED"
        assert task101.has_blocker is False
        assert task102.status == "IN_PROGRESS"

    asyncio.run(_test())
