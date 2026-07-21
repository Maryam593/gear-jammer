import { useEffect, useState } from 'react'
import { Package, Flag, Fuel, Coffee, BedDouble, RotateCcw } from 'lucide-react'

// Categorical slots 1/2/3/4 (blue/green/magenta/yellow) from the validated
// default palette. Confirmed via scripts/validate_palette.js (dataviz skill):
// all-pairs PASS in light + dark for map markers, adjacent-pairs PASS for the
// log-sheet rows. See ARCHITECTURE.md / DESIGN.md for context.
const CATEGORICAL = {
  light: { blue: '#2a78d6', green: '#008300', magenta: '#e87ba4', yellow: '#eda100', aqua: '#1baf7a', orange: '#eb6834' },
  dark: { blue: '#3987e5', green: '#008300', magenta: '#d55181', yellow: '#c98500', aqua: '#199e70', orange: '#d95926' },
}

export function usePrefersDark() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return dark
}

export function categoricalColors(dark) {
  return dark ? CATEGORICAL.dark : CATEGORICAL.light
}

// Stops: pickup/dropoff/fuel/rest_10hr render as circles using the 4 hues
// validated all-pairs (any two can be map-adjacent). break_30min/restart_34hr
// exceed that validated 4-series cap, so they render as a distinct SHAPE
// (square) instead of a 5th/6th hue — shape is the disambiguating channel
// there, not color, per the dataviz skill's "fold, facet, or direct label"
// guidance for over-cap all-pairs series. StopsList renders a matching
// swatch next to every stop as an always-visible legend.
export const STOP_COLOR_KEY = {
  pickup: 'blue',
  dropoff: 'green',
  fuel: 'magenta',
  rest_10hr: 'yellow',
  break_30min: 'aqua',
  restart_34hr: 'orange',
}

export const STOP_SHAPE = {
  pickup: 'circle',
  dropoff: 'circle',
  fuel: 'circle',
  rest_10hr: 'circle',
  break_30min: 'square',
  restart_34hr: 'square',
}

// Icon glyph per stop type, layered on top of the color/shape badge in
// StopsList so identity is legible even without color (icon shape carries it
// too, not just color/badge-shape).
export const STOP_ICON = {
  pickup: Package,
  dropoff: Flag,
  fuel: Fuel,
  rest_10hr: BedDouble,
  break_30min: Coffee,
  restart_34hr: RotateCcw,
}

export const STOP_LABEL = {
  pickup: 'Pickup',
  dropoff: 'Dropoff',
  fuel: 'Fuel stop',
  break_30min: '30-min break',
  rest_10hr: '10-hr rest',
  restart_34hr: '34-hr restart',
}

// Daily log duty-status rows, top to bottom, same 4 validated hues
// (adjacent-pairs check, since only vertically-neighboring rows/segments
// need to stay distinct here).
export const LOG_STATUS_COLOR_KEY = {
  off_duty: 'blue',
  sleeper: 'green',
  driving: 'magenta',
  on_duty: 'yellow',
}

// LocationPickerMap's 3 pin roles. Reuses the same semantic colors already
// used elsewhere so a blue pin still means "pickup" and a green pin still
// means "dropoff" everywhere in the app. "current" isn't a stop type, so it
// borrows the neutral dark shade RouteMap already uses for the trip-start dot.
export function roleColors(dark) {
  const colors = categoricalColors(dark)
  return {
    current: dark ? '#94a3b8' : '#0f172a',
    pickup: colors.blue,
    dropoff: colors.green,
  }
}
