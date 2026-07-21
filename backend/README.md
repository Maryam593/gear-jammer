# Backend — ELD Trip Planner API

Django + Django REST Framework. Stateless: one endpoint does geocoding, routing, and
the HOS calculation. See `../ARCHITECTURE.md` and `../DESIGN.md` for the full design.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash; use .venv\Scripts\activate.bat on cmd
pip install -r requirements.txt
```

## Run

```bash
python manage.py runserver 8000
```

API is now live at `http://127.0.0.1:8000/api/plan-trip/`.

## Test

```bash
python manage.py test
```

`PlanTripTests` hits the live Nominatim/OSRM public APIs (no keys needed) with a real
trip and checks the response shape and daily-log consistency. `HOSEngineInvariantTests`
exercises the HOS engine directly with synthetic long-distance input (no network calls)
to verify no duty period exceeds the 11hr driving / 14hr window limits, fuel stops land
every 1,000 miles, and the 70hr/8-day cap triggers a 34-hour restart.

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `SECRET_KEY` | dev key baked in | Django secret key |
| `DEBUG` | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated, add the deployed Vercel URL here |

## Deploy (Render)

`render.yaml` is already set up for Render's free web-service tier:

1. Push this repo to GitHub.
2. On Render: New → Blueprint → point at the repo (Render will read `backend/render.yaml`).
3. After the first deploy, update the `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` env vars
   on the Render dashboard to the actual `.onrender.com` and Vercel domains.
