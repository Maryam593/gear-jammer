import { useState } from 'react'
import { MapPin, Clock, Truck } from 'lucide-react'
import LocationPickerMap from './LocationPickerMap'

const emptyForm = {
  currentLocation: '',
  pickupLocation: '',
  dropoffLocation: '',
  currentCycleUsed: '',
}

const LOCATION_FIELDS = [
  { key: 'currentLocation', label: 'Current location', placeholder: 'Dallas, TX' },
  { key: 'pickupLocation', label: 'Pickup location', placeholder: 'Oklahoma City, OK' },
  { key: 'dropoffLocation', label: 'Dropoff location', placeholder: 'Chicago, IL' },
]

// LocationPickerMap only knows about pickup/current/dropoff "roles" — map
// those to this form's field keys so pinning writes into the same state
// typing does.
const FIELD_FOR_ROLE = {
  current: 'currentLocation',
  pickup: 'pickupLocation',
  dropoff: 'dropoffLocation',
}

const ROLE_FOR_FIELD = {
  currentLocation: 'current',
  pickupLocation: 'pickup',
  dropoffLocation: 'dropoff',
}

// A bare "TX" or "IL" is genuinely ambiguous to a geocoder (e.g. "IL" resolves
// to Israel's country code, not Illinois) — nudge toward "City, State" without
// hard-blocking real addresses that don't fit that shape.
function looksAmbiguous(value) {
  const v = value.trim()
  if (!v) return false
  return !v.includes(',') && v.length <= 3
}

function FieldIcon({ Icon }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
      <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
    </span>
  )
}

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [activeRole, setActiveRole] = useState('current')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const next = {}
    LOCATION_FIELDS.forEach(({ key }) => {
      if (!form[key].trim()) next[key] = 'Required'
    })

    const cycle = Number(form.currentCycleUsed)
    if (form.currentCycleUsed.trim() === '' || Number.isNaN(cycle)) {
      next.currentCycleUsed = "That's not a number the DOT will accept."
    } else if (cycle > 70) {
      next.currentCycleUsed = 'Nice try — 70 hrs / 8 days is the legal ceiling, not a suggestion.'
    } else if (cycle < 0) {
      next.currentCycleUsed = "Negative hours? You'd have to invent time travel first."
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      currentLocation: form.currentLocation.trim(),
      pickupLocation: form.pickupLocation.trim(),
      dropoffLocation: form.dropoffLocation.trim(),
      currentCycleUsed: Number(form.currentCycleUsed),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border-2 border-orange-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">Plan your trip 🚛</h2>

      <LocationPickerMap
        active={activeRole}
        onActiveChange={setActiveRole}
        onPick={(role, address) => update(FIELD_FOR_ROLE[role], address)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LOCATION_FIELDS.map(({ key, label, placeholder }) => {
          const warn = !errors[key] && looksAmbiguous(form[key])
          return (
            <label key={key} className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                <FieldIcon Icon={MapPin} />
                {label}
              </span>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                onFocus={() => setActiveRole(ROLE_FOR_FIELD[key])}
                placeholder={placeholder}
                disabled={loading}
                className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-orange-900 dark:disabled:bg-slate-800/60"
              />
              {errors[key] ? (
                <span className="text-xs text-red-600 dark:text-red-400">{errors[key]}</span>
              ) : warn ? (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Tip: add a state, e.g. "{placeholder}"
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">City, State</span>
              )}
            </label>
          )
        })}

        <label className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
            <FieldIcon Icon={Clock} />
            Current cycle used (hrs)
          </span>
          <input
            type="number"
            min="0"
            max="70"
            step="0.25"
            value={form.currentCycleUsed}
            onChange={(e) => update('currentCycleUsed', e.target.value)}
            placeholder="12.5"
            disabled={loading}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-orange-900 dark:disabled:bg-slate-800/60"
          />
          {errors.currentCycleUsed ? (
            <span className="text-xs text-red-600 dark:text-red-400">{errors.currentCycleUsed}</span>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">70-hr / 8-day cycle</span>
          )}
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <Truck className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          )}
          {loading ? 'Planning trip…' : 'Plan trip'}
        </button>
      </div>
    </form>
  )
}
