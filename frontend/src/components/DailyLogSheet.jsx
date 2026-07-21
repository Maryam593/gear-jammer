import { categoricalColors, usePrefersDark, LOG_STATUS_COLOR_KEY } from '../theme/vizColors'

const ROWS = [
  { key: 'off_duty', label: '1. Off Duty' },
  { key: 'sleeper', label: '2. Sleeper Berth' },
  { key: 'driving', label: '3. Driving' },
  { key: 'on_duty', label: '4. On Duty (not driving)' },
]

const LABEL_COL_WIDTH = 150
const HOUR_COL_WIDTH = 34
const GRID_WIDTH = HOUR_COL_WIDTH * 24
const ROW_HEIGHT = 34
const GRID_HEIGHT = ROW_HEIGHT * ROWS.length
const TOTALS_COL_WIDTH = 60
const HEADER_HEIGHT = 22
const SVG_WIDTH = LABEL_COL_WIDTH + GRID_WIDTH + TOTALS_COL_WIDTH
const SVG_HEIGHT = HEADER_HEIGHT + GRID_HEIGHT + 4

function hourLabel(h) {
  if (h === 0 || h === 24) return 'Mid-night'
  if (h === 12) return 'Noon'
  return h > 12 ? String(h - 12) : String(h)
}

function xForHour(hour) {
  return LABEL_COL_WIDTH + hour * HOUR_COL_WIDTH
}

function yForRow(rowIndex) {
  return HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2
}

function rowIndexForStatus(status) {
  const idx = ROWS.findIndex((r) => r.key === status)
  return idx === -1 ? 0 : idx
}

function totalsByStatus(segments) {
  const totals = { off_duty: 0, sleeper: 0, driving: 0, on_duty: 0 }
  segments.forEach((seg) => {
    totals[seg.status] = (totals[seg.status] || 0) + (seg.end_hour - seg.start_hour)
  })
  return totals
}

function formatHours(h) {
  return h % 1 === 0 ? `${h}` : h.toFixed(2)
}

export default function DailyLogSheet({ dayIndex, segments, recap, tripMeta, driverName }) {
  const dark = usePrefersDark()
  const colors = categoricalColors(dark)

  const date = new Date()
  date.setDate(date.getDate() + dayIndex)
  const dateParts = {
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: date.getDate(),
    year: date.getFullYear(),
  }

  const totals = totalsByStatus(segments)
  const hoursAvailableTomorrow = recap.cycle_hours_used != null ? Math.max(0, 70 - recap.cycle_hours_used) : null

  return (
    <div className="rounded-2xl border-2 border-orange-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-orange-100 pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Driver's Daily Log (24 hours)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dateParts.month} / {dateParts.day} / {dateParts.year} · Day {dayIndex + 1}
          </p>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <div>
            <span className="text-slate-400 dark:text-slate-500">Driver: </span>
            {driverName?.trim() || '—'}
          </div>
          {tripMeta && (
            <div>
              <span className="text-slate-400 dark:text-slate-500">From: </span>
              {tripMeta.currentLocation}
              <span className="text-slate-400 dark:text-slate-500"> To: </span>
              {tripMeta.dropoffLocation}
            </div>
          )}
          <div>
            <span className="text-slate-400 dark:text-slate-500">Total miles driving today: </span>
            {recap.miles_driven_today != null ? `${recap.miles_driven_today} mi` : '—'}
          </div>
        </div>
      </div>

      {/* legend — duty status -> color, doubles as the required legend for a
          4-series categorical encoding (dataviz skill check 6) */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        {ROWS.map((row) => (
          <span key={row.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: colors[LOG_STATUS_COLOR_KEY[row.key]] }}
              aria-hidden="true"
            />
            {row.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <svg
          data-log-sheet-svg={dayIndex}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="min-w-[760px] text-slate-700 dark:text-slate-300"
          role="img"
          aria-label={`Duty status grid for day ${dayIndex + 1}`}
        >
          {/* hour labels */}
          {Array.from({ length: 25 }, (_, h) => (
            <text
              key={`label-${h}`}
              x={xForHour(h)}
              y={HEADER_HEIGHT - 8}
              fontSize="9"
              textAnchor="middle"
              fill="currentColor"
            >
              {hourLabel(h)}
            </text>
          ))}
          <text x={LABEL_COL_WIDTH + GRID_WIDTH + TOTALS_COL_WIDTH / 2} y={HEADER_HEIGHT - 8} fontSize="9" textAnchor="middle" fill="currentColor">
            Total
          </text>

          {/* row background tints, keyed to the same status colors as the legend/line */}
          {ROWS.map((row, i) => (
            <rect
              key={`tint-${row.key}`}
              x={LABEL_COL_WIDTH}
              y={HEADER_HEIGHT + i * ROW_HEIGHT}
              width={GRID_WIDTH}
              height={ROW_HEIGHT}
              fill={colors[LOG_STATUS_COLOR_KEY[row.key]]}
              fillOpacity={dark ? 0.1 : 0.07}
            />
          ))}

          {/* grid background */}
          <rect
            x={LABEL_COL_WIDTH}
            y={HEADER_HEIGHT}
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
          />

          {/* row labels + separators */}
          {ROWS.map((row, i) => (
            <g key={row.key}>
              <text
                x={4}
                y={yForRow(i) + 3}
                fontSize="10"
                fill="currentColor"
              >
                {row.label}
              </text>
              <line
                x1={LABEL_COL_WIDTH}
                x2={LABEL_COL_WIDTH + GRID_WIDTH}
                y1={HEADER_HEIGHT + i * ROW_HEIGHT}
                y2={HEADER_HEIGHT + i * ROW_HEIGHT}
                stroke="currentColor"
                strokeOpacity="0.25"
              />
              <text
                x={LABEL_COL_WIDTH + GRID_WIDTH + TOTALS_COL_WIDTH / 2}
                y={yForRow(i) + 3}
                fontSize="10"
                textAnchor="middle"
                fill="currentColor"
              >
                {formatHours(totals[row.key])}
              </text>
            </g>
          ))}

          {/* hour + quarter-hour gridlines */}
          {Array.from({ length: 24 }, (_, h) => (
            <g key={`hour-${h}`}>
              <line
                x1={xForHour(h)}
                x2={xForHour(h)}
                y1={HEADER_HEIGHT}
                y2={HEADER_HEIGHT + GRID_HEIGHT}
                stroke="currentColor"
                strokeOpacity="0.3"
              />
              {[0.25, 0.5, 0.75].map((q) => (
                <line
                  key={q}
                  x1={xForHour(h + q)}
                  x2={xForHour(h + q)}
                  y1={HEADER_HEIGHT}
                  y2={HEADER_HEIGHT + GRID_HEIGHT}
                  stroke="currentColor"
                  strokeOpacity={q === 0.5 ? 0.18 : 0.08}
                />
              ))}
            </g>
          ))}
          <line
            x1={xForHour(24)}
            x2={xForHour(24)}
            y1={HEADER_HEIGHT}
            y2={HEADER_HEIGHT + GRID_HEIGHT}
            stroke="currentColor"
            strokeOpacity="0.3"
          />

          {/* duty status trace: each horizontal run colored by its own status
              (redundant with row position — identity is never color-alone),
              thin neutral verticals just carry the eye between rows */}
          {segments.map((seg, i) => {
            const y = yForRow(rowIndexForStatus(seg.status))
            const next = segments[i + 1]
            return (
              <g key={`seg-${i}`}>
                <line
                  x1={xForHour(seg.start_hour)}
                  x2={xForHour(seg.end_hour)}
                  y1={y}
                  y2={y}
                  stroke={colors[LOG_STATUS_COLOR_KEY[seg.status]] || 'currentColor'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {next && (
                  <line
                    x1={xForHour(seg.end_hour)}
                    x2={xForHour(next.start_hour)}
                    y1={y}
                    y2={yForRow(rowIndexForStatus(next.status))}
                    stroke="currentColor"
                    strokeOpacity="0.5"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 rounded-lg border-2 border-orange-100 p-3 text-sm dark:border-slate-800">
        <div className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
          Recap — 70-hour / 8-day rule
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-slate-500 dark:text-slate-400">On-duty today</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">{recap.on_duty_hours_today}h</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Driving today</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">{recap.driving_hours_today}h</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">A. On-duty last 8 days</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">{recap.cycle_hours_used}h</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">B. Available tomorrow (70 − A)</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">
              {hoursAvailableTomorrow != null ? `${hoursAvailableTomorrow.toFixed(2)}h` : '—'}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          If you took 34 consecutive hours off duty, you have 70 hours available.
        </p>
      </div>
    </div>
  )
}
