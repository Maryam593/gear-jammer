# Gear Jammer — ELD Trip Planner

A full-stack app (Django + React) for property-carrying truck drivers: enter a trip's
current location, pickup, dropoff, and current 70-hour/8-day cycle hours used, and get
back a route on a map plus auto-drawn, FMCSA-compliant daily ELD log sheets — fuel stops,
30-minute breaks, 10-hour resets, and 34-hour restarts all calculated automatically.

**Live app:** https://gear-jammer.vercel.app
**API:** https://gear-jammer.onrender.com

> First request to the backend can take 20-30s to respond — it's on Render's free tier,
> which spins the server down after inactivity. The form's loading state covers this.

## What it does

- **Inputs:** current location, pickup location, dropoff location, current cycle hours used
- **Route map:** full driving route (OpenStreetMap/OSRM, no API key needed) with every
  stop marked — pickup, dropoff, fuel stops, mandatory breaks and rests
- **Daily log sheets:** one per calendar day of the trip, drawn as an SVG grid matching
  the standard paper ELD log (`blank-paper-log.png` in this repo is the reference), with
  duty-status line, hour totals, and a 70-hour recap — downloadable as a PDF
- **Map-pin location picker:** click a point on a small map to fill any of the three
  location fields instead of typing, with a live reverse-geocoded address
- **Trip history:** every planned trip is saved locally in your browser (date-filterable,
  paginated) so you can revisit past log sheets without re-entering anything

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system design and the API contract, and
[`DESIGN.md`](./DESIGN.md) for the HOS rules the calculation engine enforces and the
log-sheet/UI design decisions.

## Tech stack

| | |
|---|---|
| Backend | Django + Django REST Framework, stateless (no DB/auth) |
| Frontend | React (Vite) + Tailwind CSS + react-leaflet |
| Routing / geocoding | OSRM public demo + OpenStreetMap Nominatim — both free, no API keys |
| Backend host | Render (free tier) |
| Frontend host | Vercel (free tier), auto-deploys on push to `main` |

## Repo layout

```
/backend    Django + DRF API — see backend/README.md for setup
/frontend   React (Vite) app — see frontend/README.md for setup
```

## Running it locally

```bash
# backend (terminal 1)
cd backend
python -m venv .venv && .venv/Scripts/activate   # .venv\Scripts\Activate.ps1 on PowerShell
pip install -r requirements.txt
python manage.py runserver 8000

# frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173. Full details, env vars, and deploy steps are in each
app's own README.

## Reference materials

- `new-full-stack-dev-assessment.docx` — original assessment brief
- `fmcsa-hos-395-drivers-guide-to-hos-2022-04-28-0-1-.pdf` — official FMCSA HOS rules
- `blank-paper-log.png` — target layout the drawn daily log sheet matches
