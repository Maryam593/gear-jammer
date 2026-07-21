import { useState } from 'react'
import { Truck, Route as RouteIcon, History as HistoryIcon, Trash2 } from 'lucide-react'
import TripForm from './components/TripForm'
import TripResultView from './components/TripResultView'
import CitationError from './components/CitationError'
import { planTrip } from './api/tripApi'
import { sampleResponse } from './api/fixtures/sampleResponse'
import { loadHistory, saveHistoryEntry, clearHistory } from './lib/tripHistory'

const useMock = new URLSearchParams(window.location.search).has('mock')

// Flat-illustration delivery truck (filled shapes, not line-art), with a
// gentle bob and genuinely spinning wheels (see .truck-illustration in
// index.css) — a decorative header mascot, not a functional icon.
function TruckIllustration() {
  return (
    <svg
      className="truck-illustration hidden h-16 w-44 shrink-0 sm:block"
      viewBox="0 0 176 80"
      aria-hidden="true"
    >
      {/* trailer */}
      <rect x="6" y="18" width="92" height="42" rx="7" fill="#ea580c" stroke="#1e293b" strokeWidth="2.5" />
      <rect x="18" y="30" width="68" height="4" rx="2" fill="#fdba74" />
      <rect x="18" y="40" width="68" height="4" rx="2" fill="#fdba74" />

      {/* cab */}
      <path
        d="M98 60V38a4 4 0 014-4h20.5a8 8 0 016.1 2.83l11.6 13.67H150a4 4 0 014 4v5.5"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* windshield */}
      <path d="M106 40a3 3 0 013-3h13.6a4 4 0 013.1 1.47L133 46h-27z" fill="#bae6fd" />
      {/* headlight */}
      <circle cx="151" cy="52" r="3.2" fill="#fde047" />
      {/* bumper */}
      <rect x="98" y="58" width="56" height="5" rx="2.5" fill="#334155" />

      {/* wheels */}
      <g className="wheel">
        <circle cx="30" cy="63" r="11" fill="#1e293b" />
        <circle cx="30" cy="63" r="5" fill="#e2e8f0" />
        <rect x="28.5" y="53" width="3" height="20" fill="#1e293b" />
        <rect x="20" y="61.5" width="20" height="3" fill="#1e293b" />
      </g>
      <g className="wheel">
        <circle cx="128" cy="63" r="11" fill="#1e293b" />
        <circle cx="128" cy="63" r="5" fill="#e2e8f0" />
        <rect x="126.5" y="53" width="3" height="20" fill="#1e293b" />
        <rect x="118" y="61.5" width="20" height="3" fill="#1e293b" />
      </g>

      {/* road */}
      <line x1="0" y1="74" x2="176" y2="74" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" strokeDasharray="10 8" />
    </svg>
  )
}

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

  return (
    <div className="app-bg min-h-svh">
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
          <TruckIllustration />
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
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your saved trips 🧾</h2>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear history
                  </button>
                </div>
                <ul className="flex flex-col gap-2">
                  {history.map((entry) => (
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
