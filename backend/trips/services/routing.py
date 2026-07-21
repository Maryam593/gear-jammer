import requests

OSRM_URL = "https://router.project-osrm.org/route/v1/driving/{coords}"
METERS_PER_MILE = 1609.344

LEG_NAMES = [("current", "pickup"), ("pickup", "dropoff")]


class RoutingError(Exception):
    pass


def get_route(current, pickup, dropoff):
    """
    current, pickup, dropoff: (lat, lon) tuples.
    Returns {geometry, distance_miles, duration_hours, legs: [{from, to, distance_miles, duration_hours}]}
    """
    coords = ";".join(f"{lon},{lat}" for lat, lon in (current, pickup, dropoff))
    url = OSRM_URL.format(coords=coords)
    try:
        response = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        raise RoutingError(
            "Could not compute a route between those locations. "
            "Try more specific addresses (e.g. \"Chicago, IL\" instead of \"IL\")."
        ) from exc

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(f"OSRM routing failed: {data.get('message', data.get('code'))}")

    route = data["routes"][0]

    legs = []
    for (from_name, to_name), leg in zip(LEG_NAMES, route["legs"]):
        legs.append(
            {
                "from": from_name,
                "to": to_name,
                "distance_miles": round(leg["distance"] / METERS_PER_MILE, 1),
                "duration_hours": round(leg["duration"] / 3600, 2),
            }
        )

    return {
        "geometry": route["geometry"],
        "distance_miles": round(route["distance"] / METERS_PER_MILE, 1),
        "duration_hours": round(route["duration"] / 3600, 2),
        "legs": legs,
    }
