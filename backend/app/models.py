import datetime
import json
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from .database import Base

def generate_id():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

# Association table for Task Dependencies
task_dependencies = Table(
    "task_dependencies",
    Base.metadata,
    Column("task_id", String, ForeignKey("tasks.id"), primary_key=True),
    Column("depends_on_task_id", String, ForeignKey("tasks.id"), primary_key=True)
)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_id)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=False)
    risk_level = Column(String, default="HIGH")  # HIGH, MEDIUM, LOW
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    recovery_plans = relationship("RecoveryPlan", back_populates="project", cascade="all, delete-orphan")
    events = relationship("ActivityEvent", back_populates="project", cascade="all, delete-orphan", order_by="desc(ActivityEvent.created_at)")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True)  # e.g., "TASK-101"
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner = Column(String, nullable=False)
    status = Column(String, default="NOT_STARTED")  # BLOCKED, WAITING, IN_PROGRESS, COMPLETED, NOT_STARTED
    priority = Column(String, default="MEDIUM")      # CRITICAL, HIGH, MEDIUM, LOW
    estimated_hours = Column(Float, default=2.0)
    deadline = Column(DateTime, nullable=True)
    last_updated_hours_ago = Column(Float, default=0.0)
    is_overdue = Column(Boolean, default=False)
    
    # Blocker fields
    has_blocker = Column(Boolean, default=False)
    blocker_description = Column(Text, nullable=True)
    blocker_category = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    project = relationship("Project", back_populates="tasks")
    
    # Dependencies relationships
    dependencies = relationship(
        "Task",
        secondary=task_dependencies,
        primaryjoin=id == task_dependencies.c.task_id,
        secondaryjoin=id == task_dependencies.c.depends_on_task_id,
        backref="downstream_dependents"
    )
    
    progress_updates = relationship("ProgressUpdate", back_populates="task", cascade="all, delete-orphan", order_by="desc(ProgressUpdate.created_at)")
    recovery_plans = relationship("RecoveryPlan", back_populates="task", cascade="all, delete-orphan")

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    id = Column(String, primary_key=True, default=generate_id)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    author = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status_change = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    task = relationship("Task", back_populates="progress_updates")

class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(String, primary_key=True, default=generate_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    iteration = Column(Integer, default=1)
    title = Column(String, nullable=False)
    recommended_action = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    supporting_evidence = Column(Text, default="[]")  # JSON encoded list
    expected_result = Column(Text, nullable=False)
    estimated_effort_minutes = Column(Integer, default=30)
    tasks_unblocked = Column(Text, default="[]")       # JSON encoded list of Task IDs
    verification_condition = Column(Text, nullable=False)
    alternative_action = Column(Text, nullable=False)
    status = Column(String, default="PROPOSED")        # PROPOSED, APPROVED, REJECTED, SUPERSEDED, RESOLVED
    created_at = Column(DateTime, default=get_utc_now)
    approved_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="recovery_plans")
    task = relationship("Task", back_populates="recovery_plans")
    sources = relationship("ResearchSource", back_populates="plan", cascade="all, delete-orphan")
    verification_outcomes = relationship("VerificationOutcome", back_populates="plan", cascade="all, delete-orphan", order_by="desc(VerificationOutcome.reported_at)")

    def get_supporting_evidence(self):
        try:
            return json.loads(self.supporting_evidence)
        except Exception:
            return []

    def set_supporting_evidence(self, items):
        self.supporting_evidence = json.dumps(items)

    def get_tasks_unblocked(self):
        try:
            return json.loads(self.tasks_unblocked)
        except Exception:
            return []

    def set_tasks_unblocked(self, items):
        self.tasks_unblocked = json.dumps(items)

class ResearchSource(Base):
    __tablename__ = "research_sources"

    id = Column(String, primary_key=True, default=generate_id)
    plan_id = Column(String, ForeignKey("recovery_plans.id"), nullable=True)
    project_id = Column(String, nullable=False)
    task_id = Column(String, nullable=True)
    query = Column(String, nullable=False)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    snippet = Column(Text, nullable=False)
    fetched_content = Column(Text, nullable=True)
    is_live = Column(Boolean, default=False)
    provider = Column(String, default="TinyFish Search API")
    created_at = Column(DateTime, default=get_utc_now)

    plan = relationship("RecoveryPlan", back_populates="sources")

class VerificationOutcome(Base):
    __tablename__ = "verification_outcomes"

    id = Column(String, primary_key=True, default=generate_id)
    plan_id = Column(String, ForeignKey("recovery_plans.id"), nullable=False)
    outcome = Column(String, nullable=False)  # RESOLVED, PARTIALLY_RESOLVED, STILL_BLOCKED
    notes = Column(Text, nullable=False)
    reported_at = Column(DateTime, default=get_utc_now)
    next_action_taken = Column(Text, nullable=True)

    plan = relationship("RecoveryPlan", back_populates="verification_outcomes")

class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(String, primary_key=True, default=generate_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    event_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    project = relationship("Project", back_populates="events")
