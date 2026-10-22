import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .seed_data import seed_demo_data
from .routes import projects, tasks, research, recovery, events

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("teampulse")

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TeamPulse API",
    description="Adaptive AI-powered Project Recovery Platform with TinyFish Integration",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: ensure demo data is seeded
@app.on_event("startup")
def startup_event():
    logger.info("Initializing TeamPulse backend...")
    db = SessionLocal()
    try:
        seed_demo_data(db, force_reset=False)
        logger.info("Demo project initialized successfully.")
    except Exception as e:
        logger.error(f"Error seeding demo data: {e}")
    finally:
        db.close()

# Health check
@app.get("/api/health")
def health_check():
    from .tinyfish_service import tinyfish_service
    return {
        "status": "healthy",
        "service": "TeamPulse API",
        "version": settings.VERSION,
        "tinyfish_configured": tinyfish_service.is_configured(),
        "tinyfish_mode": "LIVE" if tinyfish_service.is_configured() else "DEMO_FALLBACK"
    }

# Include routers
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(research.router, prefix="/api")
app.include_router(recovery.router, prefix="/api")
app.include_router(events.router, prefix="/api")
