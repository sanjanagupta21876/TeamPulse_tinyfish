from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from ..database import get_db
from ..models import Project, Task, RecoveryPlan, VerificationOutcome, ActivityEvent
from ..schemas import (
    RecoveryPlanGenerateRequest,
    RecoveryPlanApproveRequest,
    RecoveryPlanRejectRequest,
    VerificationSubmitRequest,
    RecoveryPlanResponse,
    VerificationOutcomeResponse,
    ResearchSourceResponse
)
from ..recovery_engine import recovery_engine

router = APIRouter(tags=["recovery"])

def plan_to_response(plan: RecoveryPlan) -> RecoveryPlanResponse:
    return RecoveryPlanResponse(
        id=plan.id,
        project_id=plan.project_id,
        task_id=plan.task_id,
        task_title=plan.task.title if plan.task else None,
        iteration=plan.iteration,
        title=plan.title,
        recommended_action=plan.recommended_action,
        reason=plan.reason,
        supporting_evidence=plan.get_supporting_evidence(),
        expected_result=plan.expected_result,
        estimated_effort_minutes=plan.estimated_effort_minutes,
        tasks_unblocked=plan.get_tasks_unblocked(),
        verification_condition=plan.verification_condition,
        alternative_action=plan.alternative_action,
        status=plan.status,
        created_at=plan.created_at,
        approved_at=plan.approved_at,
        sources=[ResearchSourceResponse.from_orm(s) for s in plan.sources],
        verification_outcomes=[VerificationOutcomeResponse.from_orm(v) for v in plan.verification_outcomes]
    )

@router.post("/recovery-plans/generate", response_model=RecoveryPlanResponse)
async def generate_plan(
    req: RecoveryPlanGenerateRequest,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = db.query(Task).filter(Task.id == req.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    all_tasks = db.query(Task).filter(Task.project_id == req.project_id).all()

    plan = await recovery_engine.generate_plan(
        project=project,
        task=task,
        all_tasks=all_tasks,
        db=db,
        custom_context=req.custom_context
    )
    return plan_to_response(plan)

@router.post("/recovery-plans/{plan_id}/approve", response_model=RecoveryPlanResponse)
def approve_plan(
    plan_id: str,
    req: RecoveryPlanApproveRequest,
    db: Session = Depends(get_db)
):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    approved_plan = recovery_engine.approve_plan(
        plan=plan,
        db=db,
        notes=req.notes,
        custom_action=req.custom_action
    )
    return plan_to_response(approved_plan)

@router.post("/recovery-plans/{plan_id}/reject", response_model=RecoveryPlanResponse)
def reject_plan(
    plan_id: str,
    req: RecoveryPlanRejectRequest,
    db: Session = Depends(get_db)
):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    plan.status = "REJECTED"
    db.add(ActivityEvent(
        project_id=plan.project_id,
        event_type="PLAN_REJECTED",
        title=f"Plan #{plan.iteration} Rejected",
        description=f"Captain rejected proposal: {req.reason}",
        metadata_json=json.dumps({"plan_id": plan.id, "reason": req.reason})
    ))
    db.commit()
    db.refresh(plan)
    return plan_to_response(plan)

@router.post("/recovery-plans/{plan_id}/verify")
async def verify_plan(
    plan_id: str,
    req: VerificationSubmitRequest,
    db: Session = Depends(get_db)
):
    """
    Submits follow-up outcome for an approved recovery plan.
    Triggers the Adaptive Verification Loop:
    - If outcome is STILL_BLOCKED or PARTIALLY_RESOLVED:
      adapts recommendation and creates Iteration 2+ with a DIFFERENT action!
    - If outcome is RESOLVED:
      marks task completed and cascades unblocking to downstream tasks.
    """
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    result = await recovery_engine.handle_verification(
        plan=plan,
        outcome_type=req.outcome,
        notes=req.notes,
        db=db
    )

    next_plan_resp = plan_to_response(result["next_plan"]) if result.get("next_plan") else None

    return {
        "success": True,
        "resolved": result["resolved"],
        "project_risk": result["project_risk"],
        "outcome": VerificationOutcomeResponse.from_orm(result["outcome"]),
        "adapted_plan": next_plan_resp
    }

@router.get("/projects/{project_id}/recovery-history", response_model=List[RecoveryPlanResponse])
def get_recovery_history(project_id: str, db: Session = Depends(get_db)):
    plans = (
        db.query(RecoveryPlan)
        .filter(RecoveryPlan.project_id == project_id)
        .order_by(RecoveryPlan.created_at.desc())
        .all()
    )
    return [plan_to_response(p) for p in plans]
