const STORAGE_KEY = 'eld-trip-history'
const MAX_ENTRIES = 20

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Deliberately excludes route.geometry — thousands of coordinate points per
// trip, would blow past localStorage's ~5-10MB quota after a handful of
// saves. History is about the log records, not re-drawing the exact polyline.
export function saveHistoryEntry({ tripMeta, stops, daily_logs }) {
  const entry = {
    id: randomId(),
    plannedAt: new Date().toISOString(),
    tripMeta,
    stops,
    daily_logs,
  }
  const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full/unavailable — history is a convenience, not critical to the
    // planning flow, so fail silently rather than surfacing an error banner.
  }
  return next
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
