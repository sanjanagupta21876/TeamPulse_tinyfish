import pytest
from datetime import datetime, timezone, timedelta
from app.models import Project, Task
from app.rules_engine import (
    calculate_project_risk,
    check_circular_dependency,
    DependencyCycleError,
    get_transitive_downstream
)

def test_circular_dependency_detection():
    now = datetime.now(timezone.utc)
    t1 = Task(id="T1", title="Task 1", owner="Dev 1", project_id="p1")
    t2 = Task(id="T2", title="Task 2", owner="Dev 2", project_id="p1")
    t3 = Task(id="T3", title="Task 3", owner="Dev 3", project_id="p1")
    
    t2.dependencies = [t1]
    t3.dependencies = [t2]
    all_tasks = [t1, t2, t3]

    # Making T1 depend on T3 would create a cycle: T1 -> T3 -> T2 -> T1
    with pytest.raises(DependencyCycleError) as exc_info:
        check_circular_dependency("T1", ["T3"], all_tasks)
    assert "Circular dependency detected" in str(exc_info.value)

def test_transitive_downstream_calculation():
    t1 = Task(id="T1", title="Task 1", owner="Dev 1", project_id="p1")
    t2 = Task(id="T2", title="Task 2", owner="Dev 2", project_id="p1")
    t3 = Task(id="T3", title="Task 3", owner="Dev 3", project_id="p1")
    t4 = Task(id="T4", title="Task 4", owner="Dev 4", project_id="p1")

    # t2 depends on t1; t3 depends on t2; t4 is independent
    t2.dependencies = [t1]
    t3.dependencies = [t2]
    all_tasks = [t1, t2, t3, t4]

    downstream_from_t1 = get_transitive_downstream("T1", all_tasks)
    assert "T2" in downstream_from_t1
    assert "T3" in downstream_from_t1
    assert "T4" not in downstream_from_t1

def test_project_risk_high_when_critical_bottleneck_blocked():
    now = datetime.now(timezone.utc)
    proj = Project(
        id="p1",
        name="Demo",
        deadline=now + timedelta(hours=6),
        risk_level="LOW"
    )
    t1 = Task(
        id="T1",
        title="Backend",
        owner="Alex",
        project_id="p1",
        status="BLOCKED",
        has_blocker=True,
        blocker_description="API contract unclear",
        last_updated_hours_ago=20.0,
        estimated_hours=3.0,
        is_overdue=True
    )
    t2 = Task(
        id="T2",
        title="Frontend",
        owner="Maya",
        project_id="p1",
        status="WAITING",
        estimated_hours=2.5,
        last_updated_hours_ago=2.0
    )
    t2.dependencies = [t1]
    all_tasks = [t1, t2]

    assessment = calculate_project_risk(proj, all_tasks)
    assert assessment.risk_level == "HIGH"
    assert assessment.blocked_tasks == 1
    assert assessment.waiting_tasks == 1
    
    # Check that conditions explain the risk factors
    factors = [c.factor for c in assessment.conditions]
    assert "Dependency Chain Bottleneck" in factors
    assert "Stale Progress Telemetry" in factors
