# ELD Trip Planner — Frontend

React (Vite) + Tailwind v4 + react-leaflet. See root `ARCHITECTURE.md` / `DESIGN.md`
for the API contract and log-sheet design this implements.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend, defaults to http://localhost:8000
npm run dev
```

## Env vars

- `VITE_API_URL` — base URL of the Django backend (no trailing slash), e.g.
  `http://localhost:8000` locally or the Render URL in production.

## Dev without a backend

Append `?mock=1` to the dev URL (e.g. `http://localhost:5173/?mock=1`) to render the UI
against a fixed sample response (`src/api/fixtures/sampleResponse.js`) instead of
calling the real API. Useful for iterating on `RouteMap` / `DailyLogSheet` while the
backend isn't ready, or for demoing the UI standalone.

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploy (Vercel)

- Framework preset: Vite (auto-detected)
- Root directory: `frontend`
- Env var: `VITE_API_URL` set to the deployed Render backend URL
- No `vercel.json` needed — this is a single-page app with no client-side router.

## Structure

```
src/
  api/tripApi.js              fetch wrapper, POST /api/plan-trip/
  api/fixtures/sampleResponse.js   mock data for ?mock=1
  components/TripForm.jsx     trip input form
  components/RouteMap.jsx     react-leaflet route + stop markers
  components/DailyLogSheet.jsx    SVG daily log grid (one per day)
  components/StopsList.jsx    stop list next to the map
  App.jsx                     wires form -> API -> results
```
