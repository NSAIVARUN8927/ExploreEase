# Phase 8 – Testing and deployment readiness

## What changed
- Added `/ready`, a database-aware readiness endpoint. `/health` remains a lightweight liveness endpoint.
- Added a pytest smoke-test suite for the root route, liveness route, and OpenAPI schema.
- Added pytest and httpx to backend test dependencies.
- Documented frontend API configuration through `VITE_API_URL`.

## Run backend tests (Windows CMD)
```cmd
cd backend
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m pytest -q
```

## Run locally
Backend: `cd backend` then `run.bat`.
Frontend: `cd frontend`, `npm install`, then `npm run dev`.

## Before production deployment
1. Set `SECRET_KEY` to a long random secret in the hosting provider. Never commit `.env`.
2. Set `DATABASE_URL` to a persistent PostgreSQL database. SQLite on an ephemeral host may lose data after restarts/redeploys.
3. Set `CORS_ORIGINS` to the exact deployed frontend origin (no trailing slash), for example `https://your-frontend.example.com`.
4. Set frontend `VITE_API_URL` to `https://your-backend.example.com/api/v1`, then rebuild the frontend.
5. Verify `/health`, `/ready`, `/docs`, registration/login, saving a trip, and reading saved trips.
6. Use HTTPS and do not expose database credentials or secret keys in frontend variables.

## Verification status
The Phase 8 files include smoke tests, but tests must be run in the user's environment with installed dependencies and configured database. A successful frontend page load alone does not verify all API flows.
