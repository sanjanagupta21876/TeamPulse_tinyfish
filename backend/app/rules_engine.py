from typing import List, Dict, Set, Tuple, Optional
from datetime import datetime, timezone
from .models import Task, Project
from .schemas import RiskAssessment, RiskCondition

class DependencyCycleError(Exception):
    pass

def check_circular_dependency(
    task_id: str,
    new_dependency_ids: List[str],
    all_tasks: List[Task]
) -> None:
    """
    Checks if setting new_dependency_ids for task_id creates a cycle.
    Raises DependencyCycleError if a cycle is detected.
    """
    # Build graph of current dependencies
    graph: Dict[str, Set[str]] = {}
    for t in all_tasks:
        graph[t.id] = {dep.id for dep in t.dependencies}
    
    # Tentatively update task_id's dependencies
    graph[task_id] = set(new_dependency_ids)
    
    # Check for cycles using DFS
    visited: Set[str] = set()
    rec_stack: Set[str] = set()
    
    def dfs(node: str, path: List[str]) -> bool:
        visited.add(node)
        rec_stack.add(node)
        
        for neighbor in graph.get(node, set()):
            if neighbor not in visited:
                if dfs(neighbor, path + [neighbor]):
                    return True
            elif neighbor in rec_stack:
                cycle_str = " -> ".join(path + [neighbor])
                raise DependencyCycleError(f"Circular dependency detected: {cycle_str}")
                
        rec_stack.remove(node)
        return False

    for node in graph:
        if node not in visited:
            dfs(node, [node])

def get_transitive_downstream(task_id: str, all_tasks: List[Task]) -> List[str]:
    """
    Returns all task IDs that transitively depend on task_id.
    """
    # mapping: upstream_id -> list of downstream_ids
    downstream_map: Dict[str, List[str]] = {t.id: [] for t in all_tasks}
    for t in all_tasks:
        for dep in t.dependencies:
            if dep.id in downstream_map:
                downstream_map[dep.id].append(t.id)
                
    visited: Set[str] = set()
    queue = list(downstream_map.get(task_id, []))
    
    while queue:
        curr = queue.pop(0)
        if curr not in visited:
            visited.add(curr)
            queue.extend(downstream_map.get(curr, []))
            
    return list(visited)

def get_transitive_upstream(task_id: str, all_tasks: List[Task]) -> List[str]:
    """
    Returns all task IDs that task_id transitively depends on.
    """
    task_map = {t.id: t for t in all_tasks}
    visited: Set[str] = set()
    
    def walk(curr_id: str):
        task = task_map.get(curr_id)
        if not task:
            return
        for dep in task.dependencies:
            if dep.id not in visited:
                visited.add(dep.id)
                walk(dep.id)
                
    walk(task_id)
    return list(visited)

def calculate_project_risk(project: Project, tasks: List[Task]) -> RiskAssessment:
    """
    Transparent, deterministic rule-based project risk assessment.
    Evaluates:
    - Hours remaining until project deadline
    - Overdue tasks
    - Critical path blocker cascading to downstream dependents
    - Stale task updates (>12 hours)
    - Capacity vs remaining workload
    """
    now = datetime.now(timezone.utc)
    
    # Calculate project hours remaining
    if project.deadline:
        deadline_tz = project.deadline.replace(tzinfo=timezone.utc) if project.deadline.tzinfo is None else project.deadline
        hours_remaining = max(0.0, (deadline_tz - now).total_seconds() / 3600.0)
    else:
        hours_remaining = 24.0

    conditions: List[RiskCondition] = []
    total_score = 0
    
    total_tasks = len(tasks)
    blocked_tasks = [t for t in tasks if t.status == "BLOCKED" or t.has_blocker]
    overdue_tasks = [t for t in tasks if t.is_overdue or (t.deadline and (t.deadline.replace(tzinfo=timezone.utc) if t.deadline.tzinfo is None else t.deadline) < now and t.status != "COMPLETED")]
    waiting_tasks = [t for t in tasks if t.status == "WAITING"]
    
    # Rule 1: Blocked Tasks with Downstream Dependencies (Bottlenecks)
    for bt in blocked_tasks:
        downstream = get_transitive_downstream(bt.id, tasks)
        if len(downstream) > 0:
            total_score += 45
            conditions.append(RiskCondition(
                factor="Dependency Chain Bottleneck",
                severity="CRITICAL",
                description=f"Task '{bt.id}' ({bt.title}) is BLOCKED and stalling {len(downstream)} downstream tasks ({', '.join(downstream)}).",
                impact=f"Cascading project stall; downstream tasks cannot proceed until {bt.id} is unblocked.",
                affected_task_ids=[bt.id] + downstream
            ))
        else:
            total_score += 20
            conditions.append(RiskCondition(
                factor="Isolated Blocker",
                severity="HIGH",
                description=f"Task '{bt.id}' ({bt.title}) is marked as BLOCKED.",
                impact="Task delivery delayed; monitoring for indirect impact.",
                affected_task_ids=[bt.id]
            ))

    # Rule 2: Overdue Tasks
    if overdue_tasks:
        total_score += 25
        conditions.append(RiskCondition(
            factor="Overdue Milestones",
            severity="HIGH" if len(overdue_tasks) > 1 else "MEDIUM",
            description=f"{len(overdue_tasks)} task(s) are past their planned milestone deadlines: {', '.join([t.id for t in overdue_tasks])}.",
            impact="Schedule compression; reduced buffer before final project deadline.",
            affected_task_ids=[t.id for t in overdue_tasks]
        ))

    # Rule 3: Stale Task Progress Updates (> 12 hours)
    stale_tasks = [t for t in tasks if (t.status in ["BLOCKED", "IN_PROGRESS", "WAITING"]) and (t.last_updated_hours_ago >= 12.0)]
    if stale_tasks:
        total_score += 20
        conditions.append(RiskCondition(
            factor="Stale Progress Telemetry",
            severity="HIGH",
            description=f"{len(stale_tasks)} active/blocked task(s) have had no progress reported for 12+ hours ({', '.join([f'{t.id} ({t.last_updated_hours_ago:.0f}h ago)' for t in stale_tasks])}).",
            impact="Lack of real-time visibility prevents proactive mitigation.",
            affected_task_ids=[t.id for t in stale_tasks]
        ))

    # Rule 4: Critical Path Workload vs Time Remaining
    # Estimate dependent chain hours (longest chain of unfinished tasks)
    critical_path_hours = sum(t.estimated_hours for t in tasks if t.status != "COMPLETED")
    
    if hours_remaining > 0 and (critical_path_hours > hours_remaining):
        total_score += 30
        conditions.append(RiskCondition(
            factor="Workload vs Remaining Time Deficit",
            severity="CRITICAL",
            description=f"Estimated remaining workload ({critical_path_hours:.1f} hours) exceeds total project time remaining ({hours_remaining:.1f} hours).",
            impact="Project will miss the submission deadline unless tasks are recovered, parallelized, or rescoped.",
            affected_task_ids=[t.id for t in tasks if t.status != "COMPLETED"]
        ))
    elif hours_remaining <= 6.0 and blocked_tasks:
        total_score += 25
        conditions.append(RiskCondition(
            factor="Impending Deadline Window",
            severity="HIGH",
            description=f"Only {hours_remaining:.1f} hours left before final deadline with unresolved blockers.",
            impact="High probability of incomplete submission without immediate intervention.",
            affected_task_ids=[bt.id for bt in blocked_tasks]
        ))

    # Determine risk level
    if total_score >= 50 or (len(blocked_tasks) > 0 and len(get_transitive_downstream(blocked_tasks[0].id, tasks)) > 0):
        risk_level = "HIGH"
        summary = f"HIGH RISK: {len(blocked_tasks)} blocker(s) actively starving {len(waiting_tasks)} downstream dependencies with only {hours_remaining:.1f}h remaining."
    elif total_score >= 25:
        risk_level = "MEDIUM"
        summary = f"MEDIUM RISK: Schedule tightness or pending tasks require close monitoring."
    else:
        risk_level = "LOW"
        summary = "LOW RISK: All tasks on schedule; dependencies clear."

    return RiskAssessment(
        project_id=project.id,
        risk_level=risk_level,
        score=min(100, total_score),
        summary=summary,
        hours_remaining=round(hours_remaining, 1),
        critical_path_hours=round(critical_path_hours, 1),
        total_tasks=total_tasks,
        blocked_tasks=len(blocked_tasks),
        overdue_tasks=len(overdue_tasks),
        waiting_tasks=len(waiting_tasks),
        conditions=conditions
    )
