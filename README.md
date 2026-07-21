# ELD Trip Planner

Full Stack Developer take-home assessment: a Django + React app that takes a trip's
current location, pickup location, dropoff location, and current cycle hours used (HOS),
and returns a route map plus auto-drawn daily ELD log sheets compliant with FMCSA
Hours-of-Service rules.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system design and
[`DESIGN.md`](./DESIGN.md) for the HOS calculation rules and UI/log-sheet design.

## Repo layout

```
/backend    Django + DRF API
/frontend   React (Vite) app
```

## Reference materials

- `new-full-stack-dev-assessment.docx` — assessment brief
- `fmcsa-hos-395-drivers-guide-to-hos-2022-04-28-0-1-.pdf` — official HOS rules
- `blank-paper-log.png` — target layout for the drawn daily log sheet
- `fmsca-image.png` — HOS guide cover/reference

## Status

Scaffolding in progress. See `ARCHITECTURE.md` / `DESIGN.md` for the plan; run
instructions will be filled in under `/backend/README.md` and `/frontend/README.md`
once each app is up.

## Deploy targets

- Backend → Render (free tier)
- Frontend → Vercel (free tier)
