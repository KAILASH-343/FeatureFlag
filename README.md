# Feature Flag Lifecycle With Stale Flag Detection

> **College Capstone Project MVP**  
> A production-grade 3-tier web application designed to track feature flag lifecycles, automatically detect stale/expired flags, maintain immutable audit histories, and enforce human-in-the-loop cleanup governance.

---

## 🏗️ 3-Tier System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Tier 1: Presentation Layer                  │
│                     React 18 + Vite                         │
│  - Modern dark slate dashboard & telemetry gauges          │
│  - Flag inventory with instant search & multi-filtering    │
│  - Real-time active/inactive toggle switch                 │
│  - Stale flag diagnostics & 1-click cleanup actions        │
│  - Lifecycle audit trail viewer & flag inspector drawer    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / JSON over HTTP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Tier 2: Business & Application Layer            │
│                  Node.js + Express REST API                 │
│  - Pure-function Stale Detection Rule Engine               │
│  - 0-100 Risk Scoring & Diagnostic Reason Generator        │
│  - Lifecycle state validator & Audit Trail logger          │
│  - Simulated runtime usage ping handler                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Connection Pool (mysql2)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Tier 3: Persistence Layer                   │
│                         MySQL 8.0                           │
│  - `flags`: metadata, timestamps, environment, status      │
│  - `flag_audit_logs`: immutable events, actor, diffs       │
│  - Foreign keys, cascade integrity, and indexing           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Stale Flag Detection Engine & Rules

Feature flags that remain in codebases indefinitely introduce dead code paths, increase deployment risk, and slow developer velocity. FlagPulse evaluates staleness dynamically using deterministic rules:

| Rule Condition | Classification | Risk Weight | Diagnostic Reason Example |
| :--- | :--- | :--- | :--- |
| **`days_since_used > 60`** | **`STALE`** | **+40 pts** | *"Flag not evaluated for 95 days (exceeds 60-day limit)"* |
| **`days_since_used > 120`** | **`STALE (Critical)`** | **+15 pts** | *"Severe inactivity: un-evaluated for over 120 days"* |
| **`days_since_modified > 90`** | **`AT RISK`** | **+25 pts** | *"Configuration untouched for 110 days (exceeds 90-day threshold)"* |
| **`expiry_date < NOW()`** | **`EXPIRED`** | **+50 pts** | *"Target expiry date (2026-08-15) passed by 37 days"* |
| **`status = 'INACTIVE'`** | **`DISABLED`** | **+10 pts** | *"Flag is disabled in production environment"* |

### Risk Score Bands (0 - 100)
- **`0 - 34` (Low Risk / Healthy)**: Actively evaluated, recently modified, within scheduled lifetime.
- **`35 - 69` (Medium Risk / Review Needed)**: Moderate inactivity; needs owner confirmation.
- **`70 - 100` (High Risk / Stale & Expired)**: Flag candidate for cleanup.

### 🛡️ Governance & Zero Auto-Delete Guarantee
- **`KEEP`**: Explicitly preserves permanent operational safeguards (e.g., killswitches, circuit breakers).
- **`REVIEW`**: Notifies team that rollout or experimentation needs owner review.
- **`CLEANUP_PENDING`**: Flags code for safe removal by developers.
- **Strict Policy**: The system **never auto-deletes** feature flags. Deletion requires explicit human confirmation.

---

## 🚀 Quickstart: Running via Docker Compose

### Prerequisites
- Docker & Docker Compose installed and running.

### 1. Start the entire 3-Tier stack
```bash
docker compose up --build -d
```

This single command automatically:
1. Starts **MySQL 8.0** on port `3306` and runs `backend/src/db/init.sql` to initialize schemas and seed 10 realistic flags.
2. Builds and launches the **Express API** on port `5001` (waits for MySQL to be healthy).
3. Builds the **React Vite** application and serves it via **Nginx** on port `3000`.

### 2. Open the Application
Open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

### 3. Check Service Logs
```bash
docker compose logs -f
```

### 4. Stop Containers
```bash
docker compose down
```

---

## 💻 Alternative: Running Locally (Local Dev)

If you prefer running without Docker containers:

### 1. Configure Environment
Create `backend/.env`:
```ini
PORT=5001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=feature_flags
```

### 2. Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
The backend will connect to MySQL, auto-create tables, and seed the 10 realistic flags.

### 3. Install & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Unit Tests
```bash
cd backend
npm test
```

---

## 🎯 Evaluator Demo Script (Step-by-Step)

Follow this 2-minute walkthrough during your project demonstration:

1. **Dashboard Overview**:
   - Navigate to the **Dashboard**.
   - Note the **5 Metric Cards**: Total Flags (10), Active Flags (7), Inactive (3), Stale (3), Expired (3).
   - Observe the **Stale Risk Distribution Bar** showing the percentage breakdown.
   - Point out the **Governance Pipeline** (`Cleanup Pending`, `Review Needed`, `Keep`).

2. **Feature Flags Inventory**:
   - Navigate to **Feature Flags**.
   - Toggle `new-payment-stripe` from **Active** to **Inactive** using the inline toggle.
   - Notice the instant state change and green toast feedback.

3. **Stale Flag Diagnosis**:
   - Navigate to **Stale Detection**.
   - Review flag `checkout-v2-redesign`:
     - Shows **Stale Score: 65/100 (HIGH RISK)**.
     - Diagnostic Reasons: *"Not used/evaluated for 95 days (exceeds 60-day threshold)"* and *"Configuration unchanged for 95 days"*.

4. **Flag Inspection & Audit Trail**:
   - Click on `checkout-v2-redesign` to slide open the **Flag Inspector Drawer**.
   - View the detailed diagnostic telemetry and the **Lifecycle History Timeline** (`FLAG_CREATED`, `CONFIG_UPDATED`, etc.).

5. **Simulate Runtime Usage Ping**:
   - Click the **Simulate Ping** button.
   - The backend records a live `USAGE_PING` in the audit log and updates `last_used_at` to current time.
   - Notice the staleness score drops immediately, showing dynamic recovery!

6. **Mark for Cleanup**:
   - Click **Mark for Cleanup**.
   - The status updates to `CLEANUP_PENDING`, and an audit record is logged.
   - Emphasize to the evaluator that **no code or flag is ever auto-deleted**.

7. **Reset Demo Data**:
   - Click the **Reset Demo Data** button in the top header anytime to restore the pristine 10 realistic seed flags.

---

## 📦 Seeded Dataset (10 Realistic Feature Flags)

| # | Flag Key | Environment | State | Health | Score | Reason / Purpose |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `checkout-v2-redesign` | Production | Active | **STALE** | 65 | Unused 95d, modified 95d |
| 2 | `new-payment-stripe` | Production | Active | **HEALTHY** | 0 | Used 2d ago |
| 3 | `summer-promo-banner-2025` | Staging | Inactive | **EXPIRED** | 60 | Expiry date passed 35d ago |
| 4 | `killswitch-sms-twilio` | Production | Active | **HEALTHY** | 25 | Permanent ops killswitch (`KEEP`) |
| 5 | `beta-ai-search` | Staging | Active | **STALE** | 65 | Unused 72d, modified 92d |
| 6 | `user-onboarding-v4` | Production | Active | **HEALTHY** | 0 | Used 1d ago |
| 7 | `legacy-csv-exporter` | Production | Inactive | **EXPIRED** | 75 | Unused 145d, expired 60d ago |
| 8 | `debug-telemetry-logs` | Development| Inactive | **STALE** | 50 | Unused 85d in dev |
| 9 | `dark-mode-global` | Production | Active | **HEALTHY** | 0 | Active rollout, used 3d ago |
| 10| `graphql-caching-v1` | Development| Active | **HEALTHY** | 0 | Created 12d ago, used 1h ago |

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Aggregated telemetry (total, active, stale, expired, risk bands) |
| `GET` | `/api/flags` | List all flags with dynamic stale detection (filterable) |
| `GET` | `/api/flags/:id` | Single flag details with complete audit trail history |
| `POST` | `/api/flags` | Create a new feature flag and log audit event |
| `PUT` | `/api/flags/:id` | Update flag metadata (description, owner, expiry, etc.) |
| `PATCH`| `/api/flags/:id/toggle` | Toggle flag between `ACTIVE` and `INACTIVE` |
| `PATCH`| `/api/flags/:id/cleanup-status`| Update recommendation: `KEEP`, `REVIEW`, `CLEANUP_PENDING` |
| `POST` | `/api/flags/:id/simulate-usage`| Simulate client evaluation (updates `last_used_at` to `NOW()`) |
| `DELETE`| `/api/flags/:id` | Delete flag and cascade delete audit records |
| `GET` | `/api/audit-logs` | Complete system-wide lifecycle audit trail |
| `POST` | `/api/admin/reset-seeds` | Reset database and restore the 10 realistic seed flags |

---

## 🔄 CI/CD Automation: Jenkins Pipeline

The repository includes a declarative `Jenkinsfile` automating:
1. **Source Checkout**: Pulls repository branch.
2. **Environment Validation**: Verifies Node.js, NPM, and Docker daemon.
3. **Backend Unit Testing**: Executes Jest tests validating stale scoring rules.
4. **Frontend Asset Compilation**: Builds React Vite production bundle.
5. **Docker Compose Lint & Build**: Validates multi-container configuration and builds images.
