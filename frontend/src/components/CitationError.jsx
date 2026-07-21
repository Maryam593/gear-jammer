import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const HEADLINES = [
  "Officer Roadmap says nope.",
  "This route got pulled over before it even started.",
  "Citation issued: address not found in these parts.",
  "Denied faster than a truck stop coffee refill.",
  "The 34-hour restart of your patience begins now.",
  "Your trip has been placed out-of-service.",
  "Dispatch says turn back around, partner.",
  "This one's going in the logbook as a violation.",
]

function randomHeadline() {
  return HEADLINES[Math.floor(Math.random() * HEADLINES.length)]
}

function ticketNumber() {
  return `HOS-${Math.floor(100000 + Math.random() * 900000)}`
}

export default function CitationError({ message, onDismiss }) {
  const [headline] = useState(randomHeadline)
  const [ticket] = useState(ticketNumber)

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-red-300 bg-red-50/60 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/30">
      <div
        className="pointer-events-none absolute top-3 right-4 rotate-[-10deg] rounded border-2 border-red-600/80 px-2 py-0.5 text-xs font-bold tracking-widest text-red-600/80 select-none dark:border-red-500/80 dark:text-red-500/80"
        aria-hidden="true"
      >
        DENIED
      </div>

      <div className="flex items-start gap-3 pr-20">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-xs font-semibold tracking-widest text-red-500 uppercase dark:text-red-400">
              Notice of Trip Violation
            </p>
            <p className="font-mono text-xs text-red-400 dark:text-red-500">No. {ticket}</p>
          </div>

          <p className="mt-1.5 text-base font-semibold text-red-800 dark:text-red-200">{headline}</p>

          <div className="mt-2 border-t border-red-200 pt-2 dark:border-red-900">
            <p className="text-xs font-medium tracking-wide text-red-500 uppercase dark:text-red-400">Details</p>
            <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{message}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900/50"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Acknowledge citation
        </button>
      </div>
    </div>
  )
}
