import { useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import RouteMap from './RouteMap'
import StopsList from './StopsList'
import DailyLogSheet from './DailyLogSheet'

function DriverNameModal({ initialValue, onCancel, onConfirm }) {
  const [value, setValue] = useState(initialValue)

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm(value.trim())
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border-2 border-orange-100 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Driver name</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Printed on the log sheets before they're downloaded.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Maryam S."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-orange-900"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onConfirm('')}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Skip
          </button>
          <button
            type="submit"
            className="rounded-full bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-700"
          >
            Continue to download
          </button>
        </div>
      </form>
    </div>
  )
}

// Shared by the live "Plan Trip" flow (has `route`, for the map) and the
// History detail view (no `route` — it's excluded from what's persisted to
// localStorage, so the map section is simply omitted there).
export default function TripResultView({ route, stops, daily_logs, tripMeta }) {
  const [exporting, setExporting] = useState(false)
  const [driverName, setDriverName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  // Drawn directly from daily_logs/tripMeta data (see exportLogSheets.js) —
  // no DOM capture involved, so there's no render-timing to wait on; the
  // name typed into the modal can be used immediately.
  async function confirmDownload(name) {
    setDriverName(name)
    setShowNamePrompt(false)
    setExporting(true)
    try {
      const { exportLogSheetsPDF } = await import('../lib/exportLogSheets')
      await exportLogSheetsPDF({ daily_logs, tripMeta, driverName: name })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your route 🗺️</h2>

      <div className={`grid grid-cols-1 gap-4 ${route ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-1'}`}>
        {route && <RouteMap route={route} stops={stops} />}
        <StopsList stops={stops} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daily log sheets 📋</h3>
        <button
          type="button"
          onClick={() => setShowNamePrompt(true)}
          disabled={exporting || !daily_logs?.length}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-orange-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-orange-800 dark:bg-slate-900 dark:text-orange-300 dark:hover:bg-orange-950/40"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {exporting ? 'Preparing PDF…' : 'Download logs (PDF)'}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {daily_logs.map((day) => (
          <DailyLogSheet
            key={day.date_offset}
            dayIndex={day.date_offset}
            segments={day.segments}
            recap={day.recap}
            tripMeta={tripMeta}
            driverName={driverName}
          />
        ))}
      </div>

      {showNamePrompt && (
        <DriverNameModal
          initialValue={driverName}
          onCancel={() => setShowNamePrompt(false)}
          onConfirm={confirmDownload}
        />
      )}
    </div>
  )
}
