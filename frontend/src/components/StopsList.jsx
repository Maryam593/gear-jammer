import { Package } from 'lucide-react'
import { categoricalColors, usePrefersDark, STOP_COLOR_KEY, STOP_SHAPE, STOP_ICON, STOP_LABEL } from '../theme/vizColors'

function formatHour(hour) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `+${h}h${m ? ` ${m}m` : ''}`
}

function StopBadge({ color, shape, Icon }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-white text-white shadow-sm dark:border-slate-900 ${shape === 'square' ? 'rounded-[6px]' : 'rounded-full'}`}
      style={{ background: color }}
      aria-hidden="true"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
    </span>
  )
}

export default function StopsList({ stops }) {
  const dark = usePrefersDark()
  const colors = categoricalColors(dark)

  return (
    <div className="flex h-full flex-col rounded-2xl border-2 border-orange-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">
        Stops along the way <span className="font-normal text-slate-400 dark:text-slate-500">({stops.length})</span>
      </h2>
      <ol className="flex flex-col gap-1">
        {stops.map((stop, i) => {
          const colorKey = STOP_COLOR_KEY[stop.type]
          const color = colorKey ? colors[colorKey] : '#64748b'
          const shape = STOP_SHAPE[stop.type] || 'circle'
          const Icon = STOP_ICON[stop.type] || Package
          return (
            <li
              key={`${stop.type}-${i}`}
              className="flex items-center gap-2 rounded-lg px-1.5 py-2 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <StopBadge color={color} shape={shape} Icon={Icon} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-800 dark:text-slate-100">
                  {STOP_LABEL[stop.type] || stop.type}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">{stop.location}</div>
              </div>
              <div className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                <div>{formatHour(stop.arrival_hour)}</div>
                <div>{stop.duration_hours}h</div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
