# Architecture

## Overview

Stateless single-purpose app. No database, no auth. One API call does everything:
geocode the three addresses, compute a route, run the HOS engine, return route + stops
+ daily logs. The frontend renders a map and a set of drawn log sheets from that
response.

```
React (Vite, Vercel)  --POST /api/plan-trip/-->  Django + DRF (Render)
                                                        |
                                                        |-- Nominatim (geocoding)
                                                        '-- OSRM public demo (routing)
```

## Why these choices

- **No DB/auth**: the assessment doesn't ask for persistence or accounts; every request
  is self-contained (locations + hours in, route + logs out). Keeping it stateless cuts
  a large chunk of build time out of the 16-hour budget.
- **OSRM + Nominatim**: both free with zero API keys, so there's nothing to configure as
  a secret on Render/Vercel and no signup step blocking a fresh clone from running.
- **Render for backend**: Vercel doesn't run a persistent Django/WSGI process well
  (it's built for serverless/Node/static frontends); Render's free web-service tier
  runs `gunicorn` directly.
- **Vercel for frontend**: React builds to static assets, which is exactly what Vercel's
  free tier is built for.

## Backend (`/backend`)

Django project `eld_planner`, single app `trips`.

| File | Responsibility |
|---|---|
| `trips/views.py` | `POST /api/plan-trip/` — orchestrates geocode → route → HOS engine → response |
| `trips/serializers.py` | Request validation, response shape |
| `trips/services/geocode.py` | Address string → `(lat, lon)` via Nominatim |
| `trips/services/routing.py` | Waypoint route via OSRM → geometry, distance, duration, per-leg splits |
| `trips/services/hos_engine.py` | The core HOS simulation — see `DESIGN.md` |

### API contract

`POST /api/plan-trip/`

Request:
```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Oklahoma City, OK",
  "dropoff_location": "Chicago, IL",
  "current_cycle_used": 12.5
}
```

Response:
```json
{
  "route": {
    "geometry": { "type": "LineString", "coordinates": [[lon, lat], ...] },
    "distance_miles": 963.2,
    "duration_hours": 14.8,
    "legs": [
      { "from": "current", "to": "pickup", "distance_miles": 190.1, "duration_hours": 3.0 },
      { "from": "pickup", "to": "dropoff", "distance_miles": 773.1, "duration_hours": 11.8 }
    ]
  },
  "stops": [
    { "type": "pickup", "location": "Oklahoma City, OK", "lat": 35.47, "lon": -97.51, "arrival_hour": 3.0, "duration_hours": 1.0 },
    { "type": "fuel", "location": "mile 1000", "lat": 38.9, "lon": -92.3, "arrival_hour": 9.5, "duration_hours": 0.5 },
    { "type": "rest_10hr", "location": "mile 1180", "lat": 39.7, "lon": -89.6, "arrival_hour": 14.0, "duration_hours": 10.0 },
    { "type": "dropoff", "location": "Chicago, IL", "lat": 41.88, "lon": -87.63, "arrival_hour": 26.8, "duration_hours": 1.0 }
  ],
  "daily_logs": [
    {
      "date_offset": 0,
      "segments": [
        { "status": "off_duty", "start_hour": 0, "end_hour": 6 },
        { "status": "on_duty", "start_hour": 6, "end_hour": 6.5 },
        { "status": "driving", "start_hour": 6.5, "end_hour": 9.5 },
        { "status": "on_duty", "start_hour": 9.5, "end_hour": 10.0 },
        { "status": "driving", "start_hour": 10.0, "end_hour": 14.0 },
        { "status": "off_duty", "start_hour": 14.0, "end_hour": 24.0 }
      ],
      "recap": { "on_duty_hours_today": 5.0, "driving_hours_today": 7.0, "miles_driven_today": 380.4, "cycle_hours_used": 17.5 }
    }
  ]
}
```

`status` is one of `off_duty | sleeper | driving | on_duty` (matching the 4 rows on the
paper log). `stops[].type` is one of `pickup | dropoff | fuel | break_30min | rest_10hr |
restart_34hr`.

### Deployment

- `requirements.txt`: Django, djangorestframework, django-cors-headers, requests, gunicorn
- `render.yaml`: build `pip install -r requirements.txt`, start `gunicorn eld_planner.wsgi`
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` read from env vars (set on Render to the Vercel domain)

## Frontend (`/frontend`)

Vite + React, Tailwind for styling.

| File | Responsibility |
|---|---|
| `src/components/TripForm.jsx` | 4 inputs, POSTs to backend |
| `src/components/RouteMap.jsx` | react-leaflet map, draws route geometry + stop markers |
| `src/components/DailyLogSheet.jsx` | SVG grid replicating `blank-paper-log.png`, one per `daily_logs` entry |
| `src/components/StopsList.jsx` | Readable list of stops next to the map |
| `src/api/tripApi.js` | fetch wrapper, base URL from `VITE_API_URL` |

### Deployment

- Vercel, `VITE_API_URL` env var set to the Render backend URL
- Static build (`vite build`), no server-side code needed

## Data flow (single request)

1. User submits the form → `POST /api/plan-trip/`
2. Backend geocodes all three addresses (Nominatim)
3. Backend requests the waypoint route from OSRM (current → pickup → dropoff)
4. `hos_engine` walks the route in time order, starting from `current_cycle_used`,
   inserting duty-status segments and stops per FMCSA rules (see `DESIGN.md`)
5. Backend returns `{route, stops, daily_logs}`
6. Frontend renders the map (route + stop markers) and one `DailyLogSheet` per day
