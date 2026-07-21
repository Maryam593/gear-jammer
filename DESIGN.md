# Design

## Assumptions (from the assessment brief)

- Property-carrying driver
- 70 hrs / 8-day cycle
- No adverse driving conditions
- Fuel at least once every 1,000 miles
- 1 hour each for pickup and drop-off

## HOS rules the engine enforces

Source: `fmcsa-hos-395-drivers-guide-to-hos-2022-04-28-0-1-.pdf`.

| Rule | Limit | Effect in the simulation |
|---|---|---|
| Driving limit | 11 hrs driving within the on-duty window | Stop driving, insert 10hr off-duty reset |
| On-duty window | 14 consecutive hrs from start of shift | Stop driving even if under 11hrs driven, insert 10hr off-duty reset |
| 30-minute break | Required after 8 cumulative hrs driving | Insert a 30-min `on_duty` (or `off_duty`) break, resets the 8hr break clock only |
| 10-hour reset | 10 consecutive hrs off duty (or sleeper) resets the 11hr/14hr clocks | Inserted whenever the 11hr or 14hr limit is hit |
| 70hr/8-day cap | 70 hrs on-duty (driving + on-duty-not-driving) in the rolling 8-day window | If `current_cycle_used` + trip on-duty hours would exceed 70, insert a 34-hour restart before continuing |
| 34-hour restart | 34 consecutive hrs off duty resets the 70hr/8-day cycle | Inserted only when the 70hr cap would otherwise be exceeded |
| Fuel stop | Every 1,000 miles | Insert a 30-min `on_duty` stop at each 1,000-mile mark |
| Pickup / drop-off | 1 hr each | Insert a 1hr `on_duty` block at the pickup and dropoff waypoints |

## Simulation algorithm (`hos_engine.py`)

Walk the route as a timeline, in order: `current_location → pickup (1hr on_duty) →
[fuel stops every 1000mi] → dropoff (1hr on_duty)`.

State carried through the walk: `clock_hour` (elapsed hours since trip start),
`drive_hours_since_break`, `drive_hours_since_reset`, `on_duty_hours_since_reset`
(the 14hr window), `cycle_hours_used` (starts at `current_cycle_used`, the 70/8 figure),
`miles_since_fuel`.

At each step (driving a leg, or an event like pickup/fuel):
1. If about to drive and `drive_hours_since_break >= 8` → insert 30-min break first, reset that counter.
2. If about to drive and `drive_hours_since_reset >= 11` or `on_duty_hours_since_reset >= 14`
   → insert a 10hr off-duty segment, reset `drive_hours_since_reset` and `on_duty_hours_since_reset` to 0.
3. If `cycle_hours_used + hours-of-this-event > 70` → insert a 34hr restart, reset `cycle_hours_used` to 0.
4. Consume the event (drive a chunk of the leg up to the next limit boundary, or perform
   the fixed-duration stop), advancing `clock_hour` and incrementing the relevant counters.
5. Whenever `clock_hour` crosses a 24-hour boundary, split the segment at that boundary
   so each `daily_logs` entry only contains segments within its own day (matches the
   paper log being a single calendar day per sheet).

This produces a flat list of duty-status segments with absolute `start_hour`/`end_hour`
(hours since trip start), which is then bucketed into `daily_logs[]` by day, and a
parallel `stops[]` list for the map (every inserted event that has a physical location:
pickup, dropoff, fuel, and the reset/restart points along the route).

## UI / log sheet design

The brief calls out UI/UX explicitly: *"Pay attention to good design and aesthetics, it
can compensate for some inaccuracies in output."* Two things need real design attention:

### 1. `DailyLogSheet` (SVG)

Matches `blank-paper-log.png` structure:
- Header row: date, from/to, total miles
- 4-row grid, Midnight → Noon → Midnight, one row each for Off Duty / Sleeper Berth /
  Driving / On Duty (not driving), with hour gridlines and quarter-hour ticks
- A single continuous line drawn across the grid, stepping between rows at each status
  change (the classic ELD zig-zag), built directly from `daily_logs[i].segments`
- Recap box: today's on-duty hours, driving hours, and rolling cycle hours used —
  from `daily_logs[i].recap`

Rendered as one `<svg>` per day so it reads exactly like a stack of paper logs, in the
order the trip actually happened.

### 2. Map + form

- Form at the top: 4 fields, clear labels, inline validation (empty fields, non-numeric
  cycle hours), a loading state on submit (geocode + route + HOS calc round-trip takes
  a couple seconds)
- Map below: route polyline, distinct marker icons for pickup / dropoff / fuel / rest
  stops, popups showing stop type + arrival time
- Log sheets below the map, stacked, one per day
- Tailwind for consistent spacing/typography; no heavy component library needed —
  this is a small enough surface area that hand-styled components stay maintainable
