# TeamPulse — Adaptive Project Recovery Platform

> **Tagline:** Detect. Diagnose. Recover.  
> **Built for:** Kritical Hacks 2026 (TinyFish Agent Track)  
> **Primary Differentiator:** TeamPulse does not stop at detecting a problem or recommending an action. It validates whether the action worked and dynamically adapts its next recommendation when recovery fails.

---

## 🎯 Executive Summary

Student software engineering teams at hackathons frequently fail due to cascading dependency bottlenecks. When an upstream backend API stalls, downstream frontend engineers and QA leads are blocked, causing schedule collapse in the final countdown hours.

**TeamPulse** solves this with an adaptive AI agent architecture:
1. **Detects** critical path bottlenecks and overdue milestones using transparent, deterministic rules.
2. **Diagnoses** blockers with live web research powered by **TinyFish Search and Fetch APIs**.
3. **Recommends** high-leverage recovery plans with human-in-the-loop approval.
4. **Adapts** dynamically via a **Closed-Loop Verification Checkpoint**: when an intervention fails or only partially succeeds, TeamPulse does not repeat the suggestion—it recognizes completed progress and formulates an adapted next strategy.

---

## 🏗️ Architecture

```
                                  +------------------------------------+
                                  |         TeamPulse Frontend         |
                                  |     (React + Vite + Tailwind)      |
                                  +-----------------+------------------+
                                                    | (REST / JSON)
                                                    v
                                  +------------------------------------+
                                  |         FastAPI Backend            |
                                  |         (Python / SQLite)          |
                                  +--------+------------------+--------+
                                           |                  |
                    +----------------------+                  +-----------------------+
                    |                                                                 |
                    v                                                                 v
+---------------------------------------+                         +---------------------------------------+
|          Deterministic Rules          |                         |            TinyFish Service           |
|  - Dependency Graph Cycle Detection   |                         |  - api.search.tinyfish.ai             |
|  - Critical Path Deficit Calculator   |                         |  - api.fetch.tinyfish.ai              |
|  - Transparent Risk Evaluation        |                         |  - Clean Markdown Extraction          |
+---------------------------------------+                         +---------------------------------------+
                    |                                                                 |
                    +----------------------+                  +-----------------------+
                                           |                  |
                                           v                  v
                                  +------------------------------------+
                                  |      Adaptive Recovery Engine      |
                                  |    - Blocker Root-Cause Triage     |
                                  |    - Human Approval Checkpoint     |
                                  |    - Adaptive Verification Loop    |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |          SQLite Database           |
                                  |     (Tasks, Plans, Evidence,       |
                                  |          Audit Timeline)           |
                                  +------------------------------------+
```

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic V2, Uvicorn.
- **Database:** SQLite (`teampulse.db`) with full transactional persistence.
- **Research Engine:** TinyFish Search (`https://api.search.tinyfish.ai`) and TinyFish Fetch (`https://api.fetch.tinyfish.ai`).
- **Safety & Transparency:** Explicit demo fallback labeling when `TINYFISH_API_KEY` is not set; zero fabricated search links.

---

## ⚡ Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & Enter Repository
```bash
git clone <repo-url>
cd TeamPulse_tinyfish
```

### 2. Environment Configuration
Copy `.env.example` to `backend/.env`:
```bash
copy .env.example backend\.env
```

Open `backend/.env` and optionally provide your TinyFish API key:
```env
# Get a free key at https://www.tinyfish.ai/
TINYFISH_API_KEY=your_tinyfish_key_here
DATABASE_URL=sqlite:///./teampulse.db
FRONTEND_URL=http://localhost:5173
```
> **Note:** If `TINYFISH_API_KEY` is left blank, TeamPulse runs in an **honest, transparent offline DEMO MODE** using verified technical reference documentation (FastAPI response models, Stoplight Prism mock servers, Pydantic validation) so the entire hackathon workflow can be explored and demonstrated without requiring credentials.

### 3. Run Backend (Port 8000)
```bash
# Using the Windows batch script:
run_backend.bat

# Or manually:
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation is available at `http://127.0.0.1:8000/docs`.

### 4. Run Frontend (Port 5173)
In a new terminal window:
```bash
# Using the Windows batch script:
run_frontend.bat

# Or manually:
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Automated Test Suite

TeamPulse includes full automated unit and workflow tests covering the rules engine, dependency cycle detection, TinyFish integration, and the end-to-end adaptive recovery loop.

To run the test suite:
```bash
python -m pytest backend/tests -v
```

Expected output:
```
backend/tests/test_rules.py::test_circular_dependency_detection PASSED
backend/tests/test_rules.py::test_transitive_downstream_calculation PASSED
backend/tests/test_rules.py::test_project_risk_high_when_critical_bottleneck_blocked PASSED
backend/tests/test_tinyfish.py::test_tinyfish_service_graceful_fallback_without_key PASSED
backend/tests/test_tinyfish.py::test_tinyfish_service_honest_labeling PASSED
backend/tests/test_workflow.py::test_end_to_end_adaptive_recovery_loop PASSED
============================== 6 passed in 1.46s ==============================
```

---

## 🎮 Primary Hackathon Demo Scenario

The seeded demo project is designed around an authentic student team sprint:

- **Project:** Hackathon App — Live Collab Canvas
- **Time Remaining:** 6.0 hours before final submission
- **Tasks:**
  1. `TASK-101`: **Backend REST API Endpoints** (Lead: Alex) — `BLOCKED` (Overdue, last updated 20h ago). Blocker: *"API integration is failing because the API contract is unclear."*
  2. `TASK-102`: **Frontend API Integration & State Wiring** (Lead: Maya) — `WAITING` on `TASK-101`.
  3. `TASK-103`: **E2E Testing & Integration Validation** (Lead: Devon) — `BLOCKED` on `TASK-102`.
  4. `TASK-104`: **Presentation Slides & Video Script** (Lead: Sarah) — `NOT_STARTED` (Independent).

### The Recovery Workflow (Video Walkthrough)
1. **Mission Control:** Observe the **HIGH RISK** score (100/100). The transparent rule engine identifies `TASK-101` as a critical bottleneck holding up 2 downstream tasks.
2. **TinyFish Research:** Click *"Start Recovery with TinyFish"*. The engine constructs a search query targeting API contract stabilization and Stoplight Prism mock servers.
3. **Plan Approval:** Inspect **Intervention #1** (*Minimal API Contract & Instant Mock Server Decoupling*). The Captain approves the plan.
4. **Adaptive Verification Loop:**
   - The team attempts the mock contract, but the follow-up outcome is **Still Blocked** (*"The API contract is documented, but the real integration is still failing with schema mismatches and 422 Unprocessable Entity."*).
   - TeamPulse **adapts immediately**: it does not re-suggest contract negotiation. Instead, it generates **Adaptive Recovery #2: Request/Response Schema Validation & Targeted Integration Testing**.
5. **Resolution:** The team runs the targeted test, aligns the schema, and submits **Fully Resolved**.
6. **Cascading Unblocking:** `TASK-101` is marked `COMPLETED`, and `TASK-102 (Frontend Integration)` automatically transitions to `IN_PROGRESS`.

To replay the demo from step 1 at any time, click **"Reset Demo"** in the top navigation bar.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & TinyFish connection status (`LIVE` or `DEMO_FALLBACK`) |
| `GET` | `/api/projects` | List active projects with remaining time and risk level |
| `GET` | `/api/projects/{id}` | Retrieve specific project details |
| `POST` | `/api/projects/{id}/analyze` | Execute deterministic risk assessment rules |
| `POST` | `/api/projects/reset-demo` | Idempotently reset demo project to clean 6h blocked scenario |
| `GET` | `/api/projects/{id}/tasks` | List all tasks with upstream and downstream dependency IDs |
| `POST` | `/api/tasks` | Create task with circular dependency validation |
| `PATCH` | `/api/tasks/{id}` | Update task status, owner, blocker, or dependencies |
| `POST` | `/api/projects/{id}/research` | Call TinyFish Search & Fetch APIs on blocker context |
| `POST` | `/api/recovery-plans/generate` | Generate evidence-informed recovery plan |
| `POST` | `/api/recovery-plans/{id}/approve` | Captain approval checkpoint |
| `POST` | `/api/recovery-plans/{id}/reject` | Reject proposal |
| `POST` | `/api/recovery-plans/{id}/verify` | **Adaptive Verification Checkpoint** (Adapts plan if blocked) |
| `GET` | `/api/projects/{id}/recovery-history` | Audit trail of all recovery iterations and outcomes |
| `GET` | `/api/projects/{id}/events` | Chronological activity event stream |

---

## 🛡️ Security & Integrity

- **Server-Side API Key Storage:** `TINYFISH_API_KEY` is exclusively handled on the FastAPI server; it is never transmitted to the browser.
- **Data Treatment:** Retrieved external web content from TinyFish is treated strictly as untrusted evidence data and sanitized.
- **Honest Attribution:** When no API key is provided, TeamPulse explicitly surfaces `DEMO MODE (TINYFISH_API_KEY not configured)`. It never fabricates simulated successful responses or fictitious URLs.
- **Human Authority:** The system never mutates production source code or deletes tasks without explicit human approval.

---

## 🏆 Kritical Hacks 2026 Deliverables
- Video Walkthrough Script: [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md)
- Backend Test Suite: [`backend/tests/`](./backend/tests/)
- Environment Template: [`.env.example`](./.env.example)
- One-Click Starters: `run_backend.bat` & `run_frontend.bat`
