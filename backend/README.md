# Incognito Backend — Privacy-Preserving Reporting Platform

## Stack
- Python 3.11
- FastAPI
- SQLAlchemy 2.0
- SQLite (dev) / PostgreSQL (prod)
- PyNaCl (Ed25519)
- Passlib (Argon2id)

## Setup & Run
1. Generate key:
```bash
python seed_demo.py --gen-key
```
2. Copy the key to `.env` as `SIGNING_KEY_B64=<key>`.
3. Seed demo data:
```bash
python seed_demo.py
```
4. Run server:
```bash
uvicorn app.main:app --reload --port 8000
```
