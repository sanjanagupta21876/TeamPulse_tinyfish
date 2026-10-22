from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    owner: str
    status: str = "NOT_STARTED" # BLOCKED, WAITING, IN_PROGRESS, COMPLETED, NOT_STARTED
    priority: str = "MEDIUM"     # CRITICAL, HIGH, MEDIUM, LOW
    estimated_hours: float = 2.0
    deadline: Optional[datetime] = None
    has_blocker: bool = False
    blocker_description: Optional[str] = None
    blocker_category: Optional[str] = None

class TaskCreate(TaskBase):
    id: str
    project_id: str
    depends_on_ids: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_hours: Optional[float] = None
    deadline: Optional[datetime] = None
    has_blocker: Optional[bool] = None
    blocker_description: Optional[str] = None
    blocker_category: Optional[str] = None
    depends_on_ids: Optional[List[str]] = None

class ProgressUpdateCreate(BaseModel):
    author: str
    content: str
    status_change: Optional[str] = None

class ProgressUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    author: str
    content: str
    status_change: Optional[str]
    created_at: datetime

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    last_updated_hours_ago: float
    is_overdue: bool
    created_at: datetime
    updated_at: datetime
    depends_on_ids: List[str] = []
    downstream_ids: List[str] = []
    progress_updates: List[ProgressUpdateResponse] = []

# --- Project & Risk Schemas ---
class RiskCondition(BaseModel):
    factor: str
    severity: str # CRITICAL, HIGH, MEDIUM, LOW
    description: str
    impact: str
    affected_task_ids: List[str] = []

class RiskAssessment(BaseModel):
    project_id: str
    risk_level: str # HIGH, MEDIUM, LOW
    score: int # 0-100
    summary: str
    hours_remaining: float
    critical_path_hours: float
    total_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    waiting_tasks: int
    conditions: List[RiskCondition]

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str]
    deadline: datetime
    risk_level: str
    hours_remaining: float
    created_at: datetime
    updated_at: datetime
    tasks_count: int
    blocked_count: int

# --- Research & TinyFish Schemas ---
class TinyFishSearchRequest(BaseModel):
    project_id: str
    task_id: Optional[str] = None
    query: Optional[str] = None
    purpose: Optional[str] = None
    fetch_top_url: bool = True

class ResearchSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    query: str
    title: str
    url: str
    domain: str
    snippet: str
    fetched_content: Optional[str] = None
    is_live: bool
    provider: str
    created_at: datetime

class ResearchResultResponse(BaseModel):
    is_live: bool
    provider: str
    query: str
    message: str
    sources: List[ResearchSourceResponse]

# --- Recovery Plan & Verification Schemas ---
class RecoveryPlanGenerateRequest(BaseModel):
    project_id: str
    task_id: str
    custom_context: Optional[str] = None

class RecoveryPlanApproveRequest(BaseModel):
    notes: Optional[str] = None
    custom_action: Optional[str] = None

class RecoveryPlanRejectRequest(BaseModel):
    reason: str

class VerificationSubmitRequest(BaseModel):
    outcome: str # RESOLVED, PARTIALLY_RESOLVED, STILL_BLOCKED
    notes: str

class VerificationOutcomeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    plan_id: str
    outcome: str
    notes: str
    reported_at: datetime
    next_action_taken: Optional[str] = None

class RecoveryPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    task_id: str
    task_title: Optional[str] = None
    iteration: int
    title: str
    recommended_action: str
    reason: str
    supporting_evidence: List[str]
    expected_result: str
    estimated_effort_minutes: int
    tasks_unblocked: List[str]
    verification_condition: str
    alternative_action: str
    status: str # PROPOSED, APPROVED, REJECTED, SUPERSEDED, RESOLVED
    created_at: datetime
    approved_at: Optional[datetime] = None
    sources: List[ResearchSourceResponse] = []
    verification_outcomes: List[VerificationOutcomeResponse] = []

# --- Activity Event Schemas ---
class ActivityEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    event_type: str
    title: str
    description: str
    metadata_json: Optional[str]
    created_at: datetime
