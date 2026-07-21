import { useEffect, useMemo, useState } from 'react'
import { Truck, Route as RouteIcon, History as HistoryIcon, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import TripForm from './components/TripForm'
import TripResultView from './components/TripResultView'
import CitationError from './components/CitationError'
import SplashScreen from './components/SplashScreen'
import TruckIllustration from './components/TruckIllustration'
import { planTrip } from './api/tripApi'
import { sampleResponse } from './api/fixtures/sampleResponse'
import { loadHistory, saveHistoryEntry, clearHistory } from './lib/tripHistory'

const useMock = new URLSearchParams(window.location.search).has('mock')
const HISTORY_PAGE_SIZE = 5

function ResultSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[420px] rounded-2xl bg-orange-50 dark:bg-slate-800" />
        <div className="h-[420px] rounded-2xl bg-orange-50 dark:bg-slate-800" />
      </div>
      <div className="h-64 rounded-2xl bg-orange-50 dark:bg-slate-800" />
    </div>
  )
}

function EmptyState({ icon: Icon = RouteIcon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-900/40 dark:text-orange-300">
        <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  )
}

function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 pt-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-orange-100 text-slate-500 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-400"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-orange-100 text-slate-500 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-400"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-orange-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-white hover:text-orange-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-orange-300'
      }`}
    >
      {children}
    </button>
  )
}

export default function App() {
  const [tab, setTab] = useState('plan')
  const [result, setResult] = useState(null)
  const [tripMeta, setTripMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState(() => loadHistory())
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [historyRoute, setHistoryRoute] = useState(null)
  const [historyRouteLoading, setHistoryRouteLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [splashVisible, setSplashVisible] = useState(true)
  const [splashMounted, setSplashMounted] = useState(true)

  const filteredHistory = useMemo(() => {
    if (!dateFrom && !dateTo) return history
    return history.filter((entry) => {
      const entryDate = entry.plannedAt.slice(0, 10)
      if (dateFrom && entryDate < dateFrom) return false
      if (dateTo && entryDate > dateTo) return false
      return true
    })
  }, [history, dateFrom, dateTo])

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE))
  const safeHistoryPage = Math.min(historyPage, historyTotalPages)
  const pagedHistory = filteredHistory.slice(
    (safeHistoryPage - 1) * HISTORY_PAGE_SIZE,
    safeHistoryPage * HISTORY_PAGE_SIZE,
  )

  // Any change to the filter (or the underlying list) can shrink the result
  // set below the current page — reset to page 1 rather than showing a stale
  // out-of-range page.
  useEffect(() => {
    setHistoryPage(1)
  }, [dateFrom, dateTo])

  useEffect(() => {
    const hide = setTimeout(() => setSplashVisible(false), 2000)
    // matches the 500ms fade duration in SplashScreen.jsx — unmount only
    // after the fade-out finishes, not before.
    const unmount = setTimeout(() => setSplashMounted(false), 2500)
    return () => {
      clearTimeout(hide)
      clearTimeout(unmount)
    }
  }, [])

  async function handleSubmit(form) {
    setLoading(true)
    setError(null)
    try {
      const data = useMock ? sampleResponse : await planTrip(form)
      setResult(data)
      setTripMeta(form)
      setHistory(saveHistoryEntry({ tripMeta: form, stops: data.stops, daily_logs: data.daily_logs }))
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  function handleClearHistory() {
    if (!window.confirm('Clear all saved trip history? This cannot be undone.')) return
    clearHistory()
    setHistory([])
    setSelectedHistoryId(null)
  }

  const selectedEntry = history.find((h) => h.id === selectedHistoryId) || null

  // History entries never store route.geometry (thousands of coordinate
  // points per trip, would blow past localStorage's quota after a handful of
  // saves — see tripHistory.js). So the map is re-fetched on demand instead:
  // same locations, deterministic result, no map at all if it fails (stops
  // list and log sheets already work fine without it).
  useEffect(() => {
    if (!selectedHistoryId) {
      setHistoryRoute(null)
      return
    }
    const entry = history.find((h) => h.id === selectedHistoryId)
    if (!entry) return

    let cancelled = false
    setHistoryRoute(null)
    setHistoryRouteLoading(true)
    ;(async () => {
      try {
        const data = useMock ? sampleResponse : await planTrip(entry.tripMeta)
        if (!cancelled) setHistoryRoute(data.route)
      } catch {
        // Silent — the map is a nice-to-have here, everything else already works.
      } finally {
        if (!cancelled) setHistoryRouteLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedHistoryId])

  return (
    <div className="app-bg min-h-svh">
      {splashMounted && <SplashScreen visible={splashVisible} />}

      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 -rotate-3 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm">
              <Truck className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">ELD Trip Planner</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Route and FMCSA-compliant daily log sheets for a trip.
                {useMock && ' (mock data mode)'}
              </p>
            </div>
          </div>
          <TruckIllustration className="hidden h-16 w-44 sm:block" />
        </header>

        <div className="road-divider" aria-hidden="true" />

        <nav className="flex w-fit gap-1 rounded-full bg-orange-50/70 p-1 dark:bg-slate-900">
          <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>
            Plan Trip
          </TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
            <HistoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
            History
            {history.length > 0 && (
              <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-orange-500">
                {history.length}
              </span>
            )}
          </TabButton>
        </nav>

        {tab === 'plan' && (
          <>
            <TripForm onSubmit={handleSubmit} loading={loading} />

            {error && <CitationError message={error} onDismiss={() => setError(null)} />}

            {loading && <ResultSkeleton />}

            {!loading && result && (
              <TripResultView route={result.route} stops={result.stops} daily_logs={result.daily_logs} tripMeta={tripMeta} />
            )}

            {!loading && !result && !error && (
              <EmptyState
                icon={RouteIcon}
                title="No trip planned yet"
                subtitle="Fill in the trip details above to get a route map and FMCSA-compliant daily log sheets."
              />
            )}
          </>
        )}

        {tab === 'history' && (
          <div className="flex flex-col gap-4">
            {selectedEntry ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedHistoryId(null)}
                  className="self-start text-sm font-medium text-orange-700 hover:underline dark:text-orange-400"
                >
                  ← Back to history
                </button>
                <TripResultView
                  route={historyRoute}
                  routeLoading={historyRouteLoading}
                  stops={selectedEntry.stops}
                  daily_logs={selectedEntry.daily_logs}
                  tripMeta={selectedEntry.tripMeta}
                />
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={HistoryIcon}
                title="No trips planned yet"
                subtitle="Trips you plan are saved here automatically, kept locally in this browser."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your saved trips</h2>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear history
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-2xl border-2 border-orange-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">From</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">To</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>
                  {(dateFrom || dateTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom('')
                        setDateTo('')
                      }}
                      className="mb-0.5 flex items-center gap-1 text-xs font-medium text-orange-700 hover:underline dark:text-orange-400"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Clear filter
                    </button>
                  )}
                  <span className="mb-0.5 ml-auto text-xs text-slate-400 dark:text-slate-500">
                    {filteredHistory.length} of {history.length} trip{history.length === 1 ? '' : 's'}
                  </span>
                </div>

                {filteredHistory.length === 0 ? (
                  <EmptyState
                    icon={HistoryIcon}
                    title="No trips in that date range"
                    subtitle="Try a wider range, or clear the filter to see everything."
                  />
                ) : (
                  <>
                    <ul className="flex flex-col gap-2">
                      {pagedHistory.map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryId(entry.id)}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-orange-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-400 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-700"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                {entry.tripMeta?.currentLocation} → {entry.tripMeta?.pickupLocation} → {entry.tripMeta?.dropoffLocation}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                {new Date(entry.plannedAt).toLocaleString()} · {entry.daily_logs?.length || 0} day
                                {entry.daily_logs?.length === 1 ? '' : 's'}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <Pager page={safeHistoryPage} totalPages={historyTotalPages} onChange={setHistoryPage} />
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
