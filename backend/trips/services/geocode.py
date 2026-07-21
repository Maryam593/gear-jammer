import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "eld-trip-planner/1.0 (assessment project)"


class GeocodeError(Exception):
    pass


def _friendly_network_error(exc):
    status_code = getattr(getattr(exc, "response", None), "status_code", None)
    if status_code == 429:
        return GeocodeError("The map lookup service is busy right now (rate limited) — please try again in a few seconds.")
    return GeocodeError("Could not reach the map lookup service. Please try again in a moment.")


def geocode(address):
    """Address string -> (lat, lon) via Nominatim."""
    try:
        response = requests.get(
            NOMINATIM_URL,
            params={"q": address, "format": "json", "limit": 1},
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        response.raise_for_status()
        results = response.json()
    except requests.RequestException as exc:
        raise _friendly_network_error(exc) from exc
    if not results:
        raise GeocodeError(f"Could not geocode address: {address}")
    return float(results[0]["lat"]), float(results[0]["lon"])


def reverse_geocode(lat, lon):
    """(lat, lon) -> short human-readable address string via Nominatim, for the map-pin picker."""
    try:
        response = requests.get(
            NOMINATIM_REVERSE_URL,
            params={"lat": lat, "lon": lon, "format": "json", "addressdetails": 1},
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
    except requests.RequestException as exc:
        raise _friendly_network_error(exc) from exc
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
