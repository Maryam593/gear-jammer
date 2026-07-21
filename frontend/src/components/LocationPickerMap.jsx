import { useCallback, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { roleColors, usePrefersDark } from '../theme/vizColors'
import { reverseGeocode } from '../api/tripApi'

const ROLES = [
  { key: 'current', label: 'Current' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'dropoff', label: 'Dropoff' },
]

const US_CENTER = [39.5, -98.35]

function pinIcon(color) {
  // Classic teardrop map pin. iconAnchor sits at the tip (bottom point) so the
  // pin visually points at the exact clicked lat/lng, not its bounding-box center.
  const svg = `
    <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.8 20.2 0 13 0z"
            fill="${color}" stroke="white" stroke-width="1.5" />
      <circle cx="13" cy="13" r="5" fill="white" />
    </svg>`
  return L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.45))">${svg}</div>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
  })
}

function ClickCatcher({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) })
  return null
}

// Compact map above the text fields for setting current/pickup/dropoff by
// clicking a point instead of typing. Purely additive: it only ever writes
// into the same field state the text inputs use (via onPick), it never reads
// from them, so typing and pinning stay in sync no matter which one is used.
export default function LocationPickerMap({ onPick, active, onActiveChange }) {
  const dark = usePrefersDark()
  const colors = roleColors(dark)

  const [markers, setMarkers] = useState({})
  const [pendingRole, setPendingRole] = useState(null)
  const [error, setError] = useState(null)

  const handleClick = useCallback(
    async (latlng) => {
      const role = active
      setMarkers((m) => ({ ...m, [role]: latlng }))
      setError(null)
      setPendingRole(role)
      try {
        const address = await reverseGeocode(latlng.lat, latlng.lng)
        onPick(role, address)
      } catch (err) {
        setError(`Couldn't look up an address for that point${err.message ? `: ${err.message}` : '.'}`)
      } finally {
        setPendingRole(null)
      }
    },
    [active, onPick],
  )

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {ROLES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onActiveChange(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active === key
                ? 'text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            style={active === key ? { background: colors[key] } : undefined}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {pendingRole ? 'Looking up address…' : 'Click the map to pin the selected field'}
        </span>
      </div>

      <div className="h-56 w-full overflow-hidden rounded-xl border-2 border-orange-100 dark:border-slate-800">
        <MapContainer center={US_CENTER} zoom={4} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onClick={handleClick} />
          {ROLES.map(({ key }) =>
            markers[key] ? <Marker key={key} position={markers[key]} icon={pinIcon(colors[key])} /> : null,
          )}
        </MapContainer>
      </div>

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
