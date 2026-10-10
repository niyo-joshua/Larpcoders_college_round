# Incognito — Privacy-Preserving Anonymous Reporting Platform

> Speak without being seen. A privacy-first whistleblowing and concerns reporting prototype built for college & workplace safety.

---

## Overview

Incognito solves the fundamental tension in anonymous reporting: **verifying submitter eligibility without storing identity-to-report links**.

### Key Privacy Guarantees
1. **Separation of Concerns:** The `reports` table contains **zero foreign keys** to members or credentials.
2. **Cryptographic One-Time Credentials:** Eligibility codes redeem Ed25519-signed credentials with a short TTL (15 minutes).
3. **Atomic Replay Prevention:** Transient credential tags are SHA-256 hashed and recorded as spent upon first submission. Replays and concurrent race conditions are strictly rejected.
4. **Coarse Bucketed Timestamps:** Report submission timestamps are bucketed to the hour to prevent network-level timestamp correlation.
5. **Private Tracking Secrets:** Submitters receive a high-entropy tracking secret (`sha256`-verified on lookup) to track status without exposing credentials.
6. **Isolated Admin Access:** Administrators moderate reports and review analytics without ever being able to retrieve who submitted them.

---

## Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS, React Router v6
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0, SQLite (dev) / PostgreSQL (prod)
- **Cryptography & Security:** PyNaCl (Ed25519 digital signatures), Passlib (Argon2id hashing), SlowAPI rate limiting

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (credentials, reports, admin, health)
│   │   ├── security/     # Ed25519 key management, Argon2id, tokens
│   │   ├── services/     # Business logic & atomic DB operations
│   │   ├── utils/        # Coarse time bucketing & safe logging
│   │   ├── config.py     # Pydantic settings
│   │   ├── database.py   # SQLAlchemy session & base
│   │   ├── models.py     # Member, Credential, Report, AdminUser ORM models
│   │   ├── schemas.py    # Request & Response Pydantic schemas
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Automated test suite (replay & privacy validation)
│   ├── seed_demo.py      # Seed script for demo members and admin
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── api/          # Privacy-aware fetch client (credentials: omit)
│   │   ├── components/   # Layouts & Badges
│   │   ├── hooks/        # In-memory admin authentication context
│   │   ├── pages/        # Landing, Verify, ReportForm, Track, Admin, SecurityDemo
│   │   ├── App.jsx       # Routing configuration
│   │   └── main.jsx      # Vite entrypoint
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## Quickstart

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Generate signing key & seed demo data
python seed_demo.py --gen-key  # Paste into .env as SIGNING_KEY_B64
python seed_demo.py

# Run server (http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## Demo Credentials

- **Member Eligibility Codes:**
  - `STU-7K2Q-9P4M`
  - `EMP-4H8J-2N6R`
  - `STU-DEMO-0001`
- **Admin Portal:**
  - URL: `/admin/login`
  - Username: `admin`
  - Password: `incognito123`

---

## Testing

Run the automated test suite verifying privacy guarantees and replay rejection:
```bash
cd backend
pytest -v
```
