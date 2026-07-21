import { useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import RouteMap from './RouteMap'
import StopsList from './StopsList'
import DailyLogSheet from './DailyLogSheet'

// Shared by the live "Plan Trip" flow (has `route`, for the map) and the
// History detail view (no `route` — it's excluded from what's persisted to
// localStorage, so the map section is simply omitted there).
export default function TripResultView({ route, stops, daily_logs, tripMeta }) {
  const logSheetsRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  async function handleDownload() {
    setExporting(true)
    try {
      // jsPDF pulls in html2canvas as part of its bundle (~130KB gzip) even
      // though we only use its canvas/addImage API, not .html(). Deferring
      // the import to click-time keeps that weight out of the initial page
      // load entirely.
      const { exportLogSheetsPDF } = await import('../lib/exportLogSheets')
      await exportLogSheetsPDF(logSheetsRef.current, tripMeta)
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
          onClick={handleDownload}
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

      <div ref={logSheetsRef} className="flex flex-col gap-4">
        {daily_logs.map((day) => (
          <DailyLogSheet
            key={day.date_offset}
            dayIndex={day.date_offset}
            segments={day.segments}
            recap={day.recap}
            tripMeta={tripMeta}
          />
        ))}
      </div>
    </div>
  )
}
