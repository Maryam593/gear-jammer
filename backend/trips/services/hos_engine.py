import math

DRIVE_LIMIT_HOURS = 11
WINDOW_LIMIT_HOURS = 14
BREAK_AFTER_HOURS = 8
BREAK_DURATION_HOURS = 0.5
RESET_DURATION_HOURS = 10
CYCLE_LIMIT_HOURS = 70
RESTART_DURATION_HOURS = 34
FUEL_INTERVAL_MILES = 1000
FUEL_DURATION_HOURS = 0.5
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0
EPS = 1e-6


class _Trip:
    def __init__(self, current_cycle_used):
        self.clock = 0.0
        self.drive_since_break = 0.0
        self.drive_since_reset = 0.0
        self.elapsed_since_reset = 0.0
        self.cycle_used = current_cycle_used
        self.miles_since_fuel = 0.0
        self.total_miles = 0.0
        self.segments = []  # raw, absolute hours since trip start; may span >24h
        self.stops = []

    def add_segment(self, status, duration, distance_miles=None):
        if duration <= EPS:
            return
        start, end = self.clock, self.clock + duration
        self.clock = end
        self.elapsed_since_reset += duration
        if status == "driving":
            self.drive_since_break += duration
            self.drive_since_reset += duration
            self.cycle_used += duration
        else:
            if duration >= BREAK_DURATION_HOURS - EPS:
                self.drive_since_break = 0.0
            if status == "on_duty":
                self.cycle_used += duration
            if status in ("off_duty", "sleeper"):
                if duration >= RESET_DURATION_HOURS - EPS:
                    self.drive_since_reset = 0.0
                    self.elapsed_since_reset = 0.0
                if duration >= RESTART_DURATION_HOURS - EPS:
                    self.cycle_used = 0.0
        self.segments.append(
            {
                "status": status,
                "start_hour": start,
                "end_hour": end,
                "cycle_after": self.cycle_used,
                "distance_miles": distance_miles,
            }
        )

    def add_stop(self, stop_type, location, lat, lon, arrival_hour, duration):
        self.stops.append(
            {
                "type": stop_type,
                "location": location,
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "arrival_hour": round(arrival_hour, 2),
                "duration_hours": duration,
            }
        )

    def ensure_capacity(self, position):
        """Insert HOS-mandated rests, at approximate (lat, lon) `position`, before the next event."""
        while True:
            if self.cycle_used >= CYCLE_LIMIT_HOURS - EPS:
                arrival = self.clock
                self.add_segment("off_duty", RESTART_DURATION_HOURS)
                self.add_stop(
                    "restart_34hr", f"mile {round(self.total_miles)}", position[0], position[1],
                    arrival, RESTART_DURATION_HOURS,
                )
                continue
            if self.drive_since_reset >= DRIVE_LIMIT_HOURS - EPS or self.elapsed_since_reset >= WINDOW_LIMIT_HOURS - EPS:
                arrival = self.clock
                self.add_segment("off_duty", RESET_DURATION_HOURS)
                self.add_stop(
                    "rest_10hr", f"mile {round(self.total_miles)}", position[0], position[1],
                    arrival, RESET_DURATION_HOURS,
                )
                continue
            if self.drive_since_break >= BREAK_AFTER_HOURS - EPS:
                arrival = self.clock
                self.add_segment("off_duty", BREAK_DURATION_HOURS)
                self.add_stop(
                    "break_30min", f"mile {round(self.total_miles)}", position[0], position[1],
                    arrival, BREAK_DURATION_HOURS,
                )
                continue
            break

    def drive_leg(self, distance_miles, duration_hours, start_coord, end_coord):
        if duration_hours <= EPS:
            return
        speed = distance_miles / duration_hours
        remaining_hours = duration_hours
        miles_driven = 0.0

        while remaining_hours > EPS:
            fraction = miles_driven / distance_miles if distance_miles > EPS else 0.0
            position = (
                start_coord[0] + fraction * (end_coord[0] - start_coord[0]),
                start_coord[1] + fraction * (end_coord[1] - start_coord[1]),
            )
            self.ensure_capacity(position)

            remaining_miles_to_fuel = FUEL_INTERVAL_MILES - self.miles_since_fuel
            if remaining_miles_to_fuel <= EPS:
                arrival = self.clock
                self.add_segment("on_duty", FUEL_DURATION_HOURS)
                self.add_stop(
                    "fuel", f"mile {round(self.total_miles)}", position[0], position[1],
                    arrival, FUEL_DURATION_HOURS,
                )
                self.miles_since_fuel = 0.0
                continue

            bounds = [
                remaining_hours,
                DRIVE_LIMIT_HOURS - self.drive_since_reset,
                WINDOW_LIMIT_HOURS - self.elapsed_since_reset,
                BREAK_AFTER_HOURS - self.drive_since_break,
                CYCLE_LIMIT_HOURS - self.cycle_used,
                remaining_miles_to_fuel / speed,
            ]
            positive_bounds = [b for b in bounds if b > EPS]
            chunk = min(positive_bounds) if positive_bounds else remaining_hours

            chunk_miles = chunk * speed
            self.add_segment("driving", chunk, distance_miles=chunk_miles)
            miles_driven += chunk_miles
            self.miles_since_fuel += chunk_miles
            self.total_miles += chunk_miles
            remaining_hours -= chunk

    def fixed_stop(self, stop_type, address, coord, duration):
        self.ensure_capacity(coord)
        arrival = self.clock
        self.add_segment("on_duty", duration)
        self.add_stop(stop_type, address, coord[0], coord[1], arrival, duration)


def _bucket_into_days(segments):
    if not segments:
        return []
    num_days = int(segments[-1]["end_hour"] // 24) + 1
    days = []
    for day in range(num_days):
        day_start, day_end = day * 24, day * 24 + 24
        day_segments = []
        cycle_used_end_of_day = None
        miles_driven_today = 0.0
        for seg in segments:
            overlap_start = max(seg["start_hour"], day_start)
            overlap_end = min(seg["end_hour"], day_end)
            if overlap_end - overlap_start <= EPS:
                continue
            day_segments.append(
                {
                    "status": seg["status"],
                    "start_hour": round(overlap_start - day_start, 2),
                    "end_hour": round(overlap_end - day_start, 2),
                }
            )
            cycle_used_end_of_day = seg["cycle_after"]
            # Speed is constant within a single segment (see drive_leg), so the
            # miles overlapping this day are the same fraction of the segment's
            # total distance as the hours overlapping this day.
            if seg["status"] == "driving" and seg.get("distance_miles"):
                seg_duration = seg["end_hour"] - seg["start_hour"]
                if seg_duration > EPS:
                    frac = (overlap_end - overlap_start) / seg_duration
                    miles_driven_today += seg["distance_miles"] * frac
        if not day_segments:
            continue
        on_duty_today = sum(s["end_hour"] - s["start_hour"] for s in day_segments if s["status"] == "on_duty")
        driving_today = sum(s["end_hour"] - s["start_hour"] for s in day_segments if s["status"] == "driving")
        days.append(
            {
                "date_offset": day,
                "segments": day_segments,
                "recap": {
                    "on_duty_hours_today": round(on_duty_today, 2),
                    "driving_hours_today": round(driving_today, 2),
                    "miles_driven_today": round(miles_driven_today, 1),
                    "cycle_hours_used": round(cycle_used_end_of_day, 2)
                    if cycle_used_end_of_day is not None
                    else None,
                },
            }
        )
    return days


def compute_hos_plan(route, current_coord, pickup_coord, dropoff_coord, current_cycle_used,
                      pickup_address, dropoff_address):
    """
    route: dict from routing.get_route (has route["legs"] = [current->pickup, pickup->dropoff]).
    *_coord: (lat, lon) tuples.
    Returns {"stops": [...], "daily_logs": [...]} per ARCHITECTURE.md's response shape.
    """
    trip = _Trip(current_cycle_used)
    leg_current_pickup, leg_pickup_dropoff = route["legs"]

    trip.drive_leg(leg_current_pickup["distance_miles"], leg_current_pickup["duration_hours"],
                   current_coord, pickup_coord)
    trip.fixed_stop("pickup", pickup_address, pickup_coord, PICKUP_DURATION_HOURS)

    trip.drive_leg(leg_pickup_dropoff["distance_miles"], leg_pickup_dropoff["duration_hours"],
                   pickup_coord, dropoff_coord)
    trip.fixed_stop("dropoff", dropoff_address, dropoff_coord, DROPOFF_DURATION_HOURS)

    # Pad the final day to a full 24h, since a real daily log always accounts for the whole day.
    remainder = math.ceil(trip.clock / 24) * 24 - trip.clock
    if remainder > EPS:
        trip.add_segment("off_duty", remainder)

    return {"stops": trip.stops, "daily_logs": _bucket_into_days(trip.segments)}
