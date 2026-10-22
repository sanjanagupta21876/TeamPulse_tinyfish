from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from ..database import get_db
from ..models import Project, Task, ResearchSource, ActivityEvent
from ..schemas import TinyFishSearchRequest, ResearchResultResponse, ResearchSourceResponse
from ..tinyfish_service import tinyfish_service

router = APIRouter(prefix="/projects", tags=["research"])

@router.post("/{project_id}/research", response_model=ResearchResultResponse)
async def research_blocker(
    project_id: str,
    req: TinyFishSearchRequest,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = None
    if req.task_id:
        task = db.query(Task).filter(Task.id == req.task_id).first()
    else:
        task = db.query(Task).filter(Task.project_id == project_id, Task.status == "BLOCKED").first()

    query = req.query
    if not query:
        if task and task.blocker_description:
            query = f"REST API troubleshooting: {task.blocker_description} schema validation mock server"
        else:
            query = "Official documentation and troubleshooting guidance for REST API integration, HTTP status codes, request and response schemas, JSON validation, and mock API testing."

    purpose = req.purpose or f"Investigate technical blockers for {task.title if task else 'Project recovery'}"

    # Log search started
    db.add(ActivityEvent(
        project_id=project.id,
        event_type="RESEARCH_STARTED",
        title="TinyFish Web Research Triggered",
        description=f"Query: '{query[:80]}...' | Purpose: '{purpose[:80]}...'",
        metadata_json=json.dumps({"query": query, "task_id": task.id if task else None})
    ))
    db.commit()

    # Call TinyFish Service
    result = await tinyfish_service.search(
        query=query,
        purpose=purpose,
        fetch_top_url=req.fetch_top_url
    )

    # Persist sources
    saved_sources = []
    for s in result.get("sources", []):
        db_source = ResearchSource(
            project_id=project.id,
            task_id=task.id if task else None,
            query=query,
            title=s.get("title", "Resource"),
            url=s.get("url", ""),
            domain=s.get("domain", ""),
            snippet=s.get("snippet", ""),
            fetched_content=s.get("fetched_content"),
            is_live=s.get("is_live", False),
            provider=s.get("provider", "TinyFish Research")
        )
        db.add(db_source)
        db.flush()
        saved_sources.append(ResearchSourceResponse.from_orm(db_source))

    # Log sources retrieved
    db.add(ActivityEvent(
        project_id=project.id,
        event_type="SOURCES_RETRIEVED",
        title=f"Retrieved {len(saved_sources)} Evidence Sources",
        description=f"Provider: {result.get('provider')} | Sources from domains: {', '.join(set([s.domain for s in saved_sources]))}",
        metadata_json=json.dumps({"count": len(saved_sources), "is_live": result.get("is_live", False)})
    ))
    db.commit()

    return ResearchResultResponse(
        is_live=result.get("is_live", False),
        provider=result.get("provider", "TinyFish Research"),
        query=query,
        message=result.get("message", "Search completed"),
        sources=saved_sources
    )

@router.get("/{project_id}/research-sources", response_model=list[ResearchSourceResponse])
def get_project_sources(project_id: str, db: Session = Depends(get_db)):
    sources = db.query(ResearchSource).filter(ResearchSource.project_id == project_id).order_by(ResearchSource.created_at.desc()).all()
    return [ResearchSourceResponse.from_orm(s) for s in sources]
