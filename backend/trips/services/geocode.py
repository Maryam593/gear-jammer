import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "eld-trip-planner/1.0 (assessment project)"


class GeocodeError(Exception):
    pass


def geocode(address):
    """Address string -> (lat, lon) via Nominatim."""
    response = requests.get(
        NOMINATIM_URL,
        params={"q": address, "format": "json", "limit": 1},
        headers={"User-Agent": USER_AGENT},
        timeout=10,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        raise GeocodeError(f"Could not geocode address: {address}")
    return float(results[0]["lat"]), float(results[0]["lon"])


def reverse_geocode(lat, lon):
    """(lat, lon) -> short human-readable address string via Nominatim, for the map-pin picker."""
    response = requests.get(
        NOMINATIM_REVERSE_URL,
        params={"lat": lat, "lon": lon, "format": "json", "addressdetails": 1},
        headers={"User-Agent": USER_AGENT},
        timeout=10,
    )
    response.raise_for_status()
    result = response.json()
    if not result or "display_name" not in result:
        raise GeocodeError(f"Could not reverse geocode ({lat}, {lon})")

    address = result.get("address", {})
    locality = address.get("city") or address.get("town") or address.get("village") or address.get("county")
    state = address.get("state")
    if locality and state:
        return f"{locality}, {state}"

    # No clean city/state pair (e.g. open water, another country) — fall back
    # to the first two comma-separated parts of Nominatim's full display_name.
    parts = result["display_name"].split(",")
    return ", ".join(p.strip() for p in parts[:2])
