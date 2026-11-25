# ExploreEase Frontend (Phase 4)

React + Vite frontend for the existing ExploreEase FastAPI backend.

## Run on Windows

1. Start the backend first from `../backend` using `run.bat`.
2. Open a new CMD window in this `frontend` folder.
3. Run:

```cmd
npm install
npm run dev
```

4. Open the URL printed by Vite (normally http://localhost:5173).

The API base URL defaults to `http://127.0.0.1:8000/api/v1`. To change it, copy `.env.example` to `.env` and edit `VITE_API_URL`.

## Included screens
- Overview / landing page
- Explore destinations with city and text filters
- Food & dining data
- Trip planner with budget summary and saved itinerary
- Saved trips
- Register, sign in, and sign out

Data is loaded from the existing backend. Empty states are shown when the repository does not contain data; unverified prices are not fabricated.
