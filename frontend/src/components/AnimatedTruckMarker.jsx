import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { STOP_LABEL } from '../theme/vizColors'

const TOTAL_DURATION_MS = 12000 // full route traversal, regardless of route length
const PAUSE_MS = 1100 // pause at each stop along the way

function truckMarkerIcon() {
  const svg = `
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="13.5" fill="#ea580c" stroke="white" stroke-width="2"/>
      <rect x="7" y="11" width="9" height="7" rx="1" fill="#fff"/>
      <path d="M16 13.5h3.6l2 2.4V18H16z" fill="#fff"/>
      <circle cx="11" cy="19.5" r="1.5" fill="#ea580c"/>
      <circle cx="19.5" cy="19.5" r="1.5" fill="#ea580c"/>
    </svg>`
  return L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.45))">${svg}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

function stopPopupHtml(stop) {
  const h = Math.floor(stop.arrival_hour)
  const m = Math.round((stop.arrival_hour - h) * 60)
  const label = STOP_LABEL[stop.type] || stop.type
  return `<div style="font-size:13px;line-height:1.5">
    <div style="font-weight:600">${label}</div>
    <div>${stop.location}</div>
    <div>Arrival: +${h}h${m ? ` ${m}m` : ''}</div>
    <div>Duration: ${stop.duration_hours}h</div>
  </div>`
}

// Degree-space squared distance — fine for finding the nearest sample point
// along a route polyline, no need for a real haversine here.
function sqDist(a, b) {
  const dLat = a[0] - b[0]
  const dLon = a[1] - b[1]
  return dLat * dLat + dLon * dLon
}

function nearestIndex(positions, target) {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < positions.length; i++) {
    const d = sqDist(positions[i], target)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return best
}

// Imperative Leaflet layer (not a React-rendered <Marker>) so moving it every
// animation frame doesn't go through React's render cycle — driven by
// useMap() to get the raw map instance. Must be rendered as a child of
// <MapContainer> for that hook to work.
export default function AnimatedTruckMarker({ positions, stops, playing, onDone }) {
  const map = useMap()
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!playing || positions.length < 2) return

    cancelledRef.current = false
    const marker = L.marker(positions[0], { icon: truckMarkerIcon(), zIndexOffset: 1000, interactive: false }).addTo(map)

    // For each stop, the fraction of the route (by sample-point index)
    // closest to that stop's actual lat/lon — stops already sit on the
    // route path (the backend places them via the same drive_leg
    // interpolation used to build the geometry), so nearest-point matching
    // lines up cleanly without needing per-point cumulative distance.
    const pausePoints = stops
      .map((stop) => ({ stop, index: nearestIndex(positions, [stop.lat, stop.lon]) }))
      .filter((p) => p.index > 0 && p.index < positions.length - 1)
      .sort((a, b) => a.index - b.index)
      .map((p) => ({ ...p, fraction: p.index / (positions.length - 1) }))

    let pauseIdx = 0
    let paused = false
    let pauseRemaining = 0
    let elapsedActive = 0
    let lastTime = null
    let rafId = null

    function frame(now) {
      if (cancelledRef.current) return
      if (lastTime === null) lastTime = now
      const dt = now - lastTime
      lastTime = now

      if (paused) {
        pauseRemaining -= dt
        if (pauseRemaining <= 0) paused = false
        rafId = requestAnimationFrame(frame)
        return
      }

      elapsedActive += dt
      const progress = Math.min(1, elapsedActive / TOTAL_DURATION_MS)
      const idx = progress * (positions.length - 1)
      const i0 = Math.floor(idx)
      const i1 = Math.min(positions.length - 1, i0 + 1)
      const t = idx - i0
      const lat = positions[i0][0] + (positions[i1][0] - positions[i0][0]) * t
      const lon = positions[i0][1] + (positions[i1][1] - positions[i0][1]) * t
      marker.setLatLng([lat, lon])

      if (pauseIdx < pausePoints.length && progress >= pausePoints[pauseIdx].fraction) {
        const p = pausePoints[pauseIdx]
        marker.setLatLng(positions[p.index])
        marker.bindPopup(stopPopupHtml(p.stop)).openPopup()
        paused = true
        pauseRemaining = PAUSE_MS
        pauseIdx += 1
        rafId = requestAnimationFrame(frame)
        return
      }

      if (progress >= 1) {
        onDone?.()
        return
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)

    return () => {
      cancelledRef.current = true
      if (rafId) cancelAnimationFrame(rafId)
      map.removeLayer(marker)
    }
  }, [playing, positions, stops, map, onDone])

  return null
}
