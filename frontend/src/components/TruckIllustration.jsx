// Flat-illustration delivery truck (filled shapes, not line-art), with a
// gentle bob and genuinely spinning wheels (see .truck-illustration in
// index.css) — a decorative mascot, not a functional icon. `className`
// controls sizing/visibility so it can be reused at different scales
// (header badge vs. splash screen hero).
export default function TruckIllustration({ className = 'h-16 w-44' }) {
  return (
    <svg className={`truck-illustration shrink-0 ${className}`} viewBox="0 0 176 80" aria-hidden="true">
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
