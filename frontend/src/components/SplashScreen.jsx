import TruckIllustration from './TruckIllustration'

// Shown for ~2s on first load (see the timer in App.jsx), then fades out.
// `visible` toggles the fade so the splash can animate out instead of
// disappearing abruptly.
export default function SplashScreen({ visible }) {
  return (
    <div
      className={`app-bg fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <TruckIllustration className="h-24 w-64" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gear Jammer</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading up the rig…</p>
      <div className="road-divider mt-2 h-2.5 w-40" aria-hidden="true" />
    </div>
  )
}
