import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup } from 'react-leaflet'
import { useMemo } from 'react'
import L from 'leaflet'
import { categoricalColors, usePrefersDark, STOP_COLOR_KEY, STOP_SHAPE, STOP_LABEL } from '../theme/vizColors'

function formatHour(hour) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `+${h}h${m ? ` ${m}m` : ''}`
}

function squareIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function StopPopup({ type, stop }) {
  return (
    <Popup>
      <div className="text-sm">
        <div className="font-semibold">{STOP_LABEL[type] || type}</div>
        <div>{stop.location}</div>
        <div>Arrival: {formatHour(stop.arrival_hour)}</div>
        <div>Duration: {stop.duration_hours}h</div>
      </div>
    </Popup>
  )
}

export default function RouteMap({ route, stops }) {
  const dark = usePrefersDark()
  const colors = categoricalColors(dark)

  const positions = useMemo(
    () => route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    [route.geometry.coordinates],
  )

  const startPosition = positions[0]

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl border-2 border-orange-100 shadow-sm dark:border-slate-800">
      <MapContainer bounds={positions} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} pathOptions={{ color: colors.blue, weight: 4, opacity: 0.85 }} />

        {startPosition && (
          <CircleMarker
            center={startPosition}
            radius={7}
            pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 1, weight: 2 }}
          >
            <Popup>Trip start</Popup>
          </CircleMarker>
        )}

        {stops.map((stop, i) => {
          const key = `${stop.type}-${i}`
          const colorKey = STOP_COLOR_KEY[stop.type]
          const color = colorKey ? colors[colorKey] : '#64748b'
          const shape = STOP_SHAPE[stop.type] || 'circle'

          if (shape === 'square') {
            return (
              <Marker key={key} position={[stop.lat, stop.lon]} icon={squareIcon(color)}>
                <StopPopup type={stop.type} stop={stop} />
              </Marker>
            )
          }

          return (
            <CircleMarker
              key={key}
              center={[stop.lat, stop.lon]}
              radius={8}
              pathOptions={{ color: 'white', weight: 2, fillColor: color, fillOpacity: 1 }}
            >
              <StopPopup type={stop.type} stop={stop} />
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
