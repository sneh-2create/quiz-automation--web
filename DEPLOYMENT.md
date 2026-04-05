# Production deployment (checklist)

## Credentials you must provide

| Variable | Where | Purpose |
|----------|--------|---------|
| `SECRET_KEY` | `backend/.env` | Signs JWTs — use 32+ random bytes (e.g. `openssl rand -hex 32`) |
| `DATABASE_URL` | `backend/.env` | PostgreSQL URL for real concurrency (~1500 users); avoid SQLite for heavy write load |
| `GEMINI_API_KEY` | `backend/.env` | Optional; only if teachers use AI question generation |
| `VITE_API_URL` | `frontend/.env` at **build time** | Public URL of your API, e.g. `https://api.yourdomain.com/api` |

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`, then edit.

## Backend

1. Python 3.11+ recommended.
2. `cd backend && pip install -r requirements.txt`
3. Set `DATABASE_URL` to PostgreSQL. Run app once so tables exist, or use your migration process.
4. For PostgreSQL, add new columns to match `app/models/*` (this repo uses SQLite auto-migrations in `migrations_sqlite.py`; Postgres users should mirror schema or introduce Alembic).
5. Start with a process manager, e.g.  
   `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`  
   (Adjust workers to CPU; use a reverse proxy for TLS.)

## Frontend

1. `cd frontend && npm ci && npm run build`
2. Set `VITE_API_URL` before `npm run build` so the bundle points at production API.
3. Serve `frontend/dist` with nginx, S3+CloudFront, Vercel, etc.

## Load (~1500 concurrent attempts)

- Use **PostgreSQL**, multiple **Uvicorn workers**, and **connection pooling**.
- Enable HTTP keep-alive and gzip at the reverse proxy.
- SQLite + WAL is acceptable for **demos and moderate** traffic only.

## Health checks

- `GET /api/health` — no DB
- `GET /api/whoami` — confirms this FastAPI app is bound to the port

## Demo logins (disable or change passwords in production)

- Admin: `admin@quizplatform.com` / `Admin@123`
- Teacher: `teacher@quizplatform.com` / `Teacher@123`
- Student: registration ID `REG2026DEMO` / `Student@123` (participant code `PIETDEMO` on dashboard)

Remove or rotate these in production.
