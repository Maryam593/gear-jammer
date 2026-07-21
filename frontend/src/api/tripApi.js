const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function planTrip({ currentLocation, pickupLocation, dropoffLocation, currentCycleUsed }) {
  const res = await fetch(`${API_URL}/api/plan-trip/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used: currentCycleUsed,
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body.error || body.detail || JSON.stringify(body)
    } catch {
      detail = res.statusText
    }
    throw new Error(`Trip planning failed (${res.status}): ${detail}`)
  }

  return res.json()
}

export async function reverseGeocode(lat, lon) {
  const res = await fetch(`${API_URL}/api/reverse-geocode/?lat=${lat}&lon=${lon}`)

  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body.error || body.detail || JSON.stringify(body)
    } catch {
      detail = res.statusText
    }
    throw new Error(detail)
  }

  const data = await res.json()
  return data.address
}
