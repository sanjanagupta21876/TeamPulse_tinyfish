@echo off
echo ========================================================
echo Starting TeamPulse Backend (FastAPI + Uvicorn)
echo ========================================================
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
