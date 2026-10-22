# TeamPulse — Hackathon Video Presentation Script
**Kritical Hacks 2026 | Track: TinyFish Agent Track**  
**Tagline:** *Detect. Diagnose. Recover.*  
**Duration:** 2 to 3 minutes

---

## 🎬 Video Recording Walkthrough

### 0:00 – 0:25 | The Problem & The Core Differentiator
- **Visual:** Open browser at `http://localhost:5173/`. Screen displays the dark Mission Control dashboard.
- **Presenter Voiceover:**
  > "Every student hackathon team has lived through this nightmare: it's 6 hours before the deadline, and a single blocked backend endpoint halts frontend integration and kills the project.
  > Most AI tools stop at generating a chatbot suggestion. **TeamPulse is different:**
  > TeamPulse does not stop at detecting a problem or recommending an action. It checks whether the action worked, and if recovery fails, it changes its next recommendation."

---

### 0:25 – 0:50 | Step 1: Detect Bottlenecks & Transparent Risk Rules
- **Visual:** Point to the top countdown timer (`06:00:00`) and the **HIGH RISK** badge. Click **"Analyze Project Risk"**.
- **Presenter Voiceover:**
  > "Here in Mission Control, TeamPulse's deterministic rules engine monitors our project state in SQLite. 
  > Notice it doesn't give a vague score—it highlights that `TASK-101 (Backend REST API)` is BLOCKED and overdue, with no progress for 20 hours.
  > Worse: it is starving 2 dependent downstream tasks—`TASK-102 (Frontend Integration)` and `TASK-103 (E2E Testing)`."
- **Visual:** Switch to **"Dependency Flow"** tab. Show the glowing dependency arrow from `TASK-101` (red) to `TASK-102` (amber) to `TASK-103`.

---

### 0:50 – 1:20 | Step 2: Live Technical Research with TinyFish
- **Visual:** Click **"Start Recovery with TinyFish"** or switch to the **"TinyFish Research"** tab.
- **Presenter Voiceover:**
  > "When a technical blocker strikes, TeamPulse investigates the web using **TinyFish's Search and Fetch APIs**.
  > Rather than relying on hallucinated training memory, TinyFish searches the live web for REST API schema validation and OpenAPI mock architectures, fetching clean markdown documentation without ad clutter.
  > Users can inspect genuine source URLs, domains, and extracted text right here."

---

### 1:20 – 1:50 | Step 3: Actionable Recovery Plan & Human Approval
- **Visual:** Switch to the **"Recovery Center"** tab.
- **Presenter Voiceover:**
  > "TeamPulse synthesizes project constraints and TinyFish evidence to generate **Intervention #1: Minimal API Contract & Instant Mock Server Decoupling**.
  > It explains why: frontend is starved. By decoupling Maya with a mock server on port 4010, frontend work proceeds in parallel while Alex finishes database endpoints.
  > Notice the Human Approval Checkpoint: TeamPulse never mutates code or reassigns work without explicit captain approval. We click **Approve & Activate Plan**."

---

### 1:50 – 2:30 | Step 4: The Adaptive Verification Loop (The Core Innovation)
- **Visual:** Show the active **Adaptive Verification Checkpoint**.
- **Presenter Voiceover:**
  > "Here is our main innovation: **The Adaptive Verification Loop**.
  > What happens when an intervention doesn't work? Let's say the team documented the contract, but integration is still failing with HTTP 422 schema errors.
  > We select **Still Blocked** with the note: *'API contract is documented, but real integration is failing with schema mismatches and 422 Unprocessable Entity.'*
  > Watch what happens when we submit..."
- **Visual:** Click **"Submit & Trigger Adaptive Next Recommendation"**.
- **Presenter Voiceover:**
  > "TeamPulse did **NOT** repeat the original suggestion!
  > It recognized that the contract is already documented, and dynamically adapted to **Adaptive Recovery #2: Request/Response Schema Validation & Targeted Integration Testing**.
  > It isolates the exact Pydantic schema validation mismatch using evidence retrieved via TinyFish."

---

### 2:30 – 3:00 | Step 5: Resolution & Cascading Downstream Unblocking
- **Visual:** Click **"Approve & Activate Plan"** on Iteration #2. Then select **"Fully Resolved"** with note: *'Payload schemas aligned and API contract integration test is passing with HTTP 200.'* Click **"Submit"**.
- **Visual:** Show the celebration banner, then switch to **"Task Management"** and **"Mission Control"**.
- **Presenter Voiceover:**
  > "Once verified as resolved, TeamPulse automatically marks `TASK-101` as COMPLETED, moves `TASK-102 (Frontend Integration)` from WAITING to IN_PROGRESS, and drops project risk.
  > On the **Recovery Timeline**, judges can audit the entire closed-loop recovery trajectory.
  > And with one click on **Reset Demo**, any judge can re-run this entire experience from scratch.
  > TeamPulse: Detect. Diagnose. Recover. Thank you!"

---

## 💡 Demo Reset Instructions
At any point during testing or re-recording:
- Click the **"Reset Demo"** button in the top navigation bar.
- Or send a POST request:
  ```bash
  curl -X POST http://localhost:8000/api/projects/reset-demo
  ```
- The database is instantly restored to its pristine 6-hour high-risk blocked state.
