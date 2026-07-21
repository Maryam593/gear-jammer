from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from trips.services.hos_engine import _Trip


class PlanTripTests(APITestCase):
    def test_multi_day_trip_returns_route_stops_and_daily_logs(self):
        response = self.client.post(
            "/api/plan-trip/",
            {
                "current_location": "Dallas, TX",
                "pickup_location": "Oklahoma City, OK",
                "dropoff_location": "Chicago, IL",
                "current_cycle_used": 12.5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        data = response.data

        self.assertIn("route", data)
        self.assertGreater(data["route"]["distance_miles"], 0)

        self.assertGreaterEqual(len(data["stops"]), 1)
        for stop in data["stops"]:
            self.assertIn(stop["type"], {"pickup", "dropoff", "fuel", "break_30min", "rest_10hr", "restart_34hr"})

        self.assertGreaterEqual(len(data["daily_logs"]), 1)
        for day in data["daily_logs"]:
            segments = day["segments"]
            self.assertGreater(len(segments), 0)

            # Segments must be chronological, non-overlapping, and cover the full day.
            self.assertAlmostEqual(segments[0]["start_hour"], 0.0, places=2)
            self.assertAlmostEqual(segments[-1]["end_hour"], 24.0, places=2)
            for prev, nxt in zip(segments, segments[1:]):
                self.assertAlmostEqual(prev["end_hour"], nxt["start_hour"], places=2)


class ReverseGeocodeTests(APITestCase):
    def test_reverse_geocode_returns_address(self):
        response = self.client.get("/api/reverse-geocode/", {"lat": 41.8781, "lon": -87.6298})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data.get("address"))

    def test_reverse_geocode_requires_lat_lon(self):
        response = self.client.get("/api/reverse-geocode/")
        self.assertEqual(response.status_code, 400)


class HOSEngineInvariantTests(SimpleTestCase):
    """
    A calendar day can legitimately contain more than 11 hours of driving (e.g. the
    tail of one duty period plus the start of the next, separated by a 10hr reset),
    so the real invariant to check is per duty-period, not per calendar day. Runs
    against the engine's raw (pre-day-split) segments, no network calls.
    """

    def test_no_duty_period_exceeds_driving_or_window_limits(self):
        trip = _Trip(current_cycle_used=0)
        trip.drive_leg(distance_miles=2400, duration_hours=48.0, start_coord=(0.0, 0.0), end_coord=(0.0, 20.0))

        self.assertTrue(trip.segments)
        drive_since_reset = 0.0
        elapsed_since_reset = 0.0
        for seg in trip.segments:
            duration = seg["end_hour"] - seg["start_hour"]
            if seg["status"] == "off_duty" and duration >= 9.99:
                drive_since_reset = 0.0
                elapsed_since_reset = 0.0
                continue
            elapsed_since_reset += duration
            if seg["status"] == "driving":
                drive_since_reset += duration
            self.assertLessEqual(drive_since_reset, 11.01)
            self.assertLessEqual(elapsed_since_reset, 14.01)

    def test_fuel_stop_inserted_every_1000_miles(self):
        trip = _Trip(current_cycle_used=0)
        trip.drive_leg(distance_miles=2400, duration_hours=48.0, start_coord=(0.0, 0.0), end_coord=(0.0, 20.0))

        fuel_stops = [s for s in trip.stops if s["type"] == "fuel"]
        # ~2400 miles should need 2 fuel stops (at mile 1000 and mile 2000).
        self.assertEqual(len(fuel_stops), 2)

    def test_cycle_hours_trigger_34_hour_restart(self):
        trip = _Trip(current_cycle_used=65)
        trip.drive_leg(distance_miles=600, duration_hours=12.0, start_coord=(0.0, 0.0), end_coord=(0.0, 5.0))

        restarts = [s for s in trip.stops if s["type"] == "restart_34hr"]
        self.assertEqual(len(restarts), 1)
