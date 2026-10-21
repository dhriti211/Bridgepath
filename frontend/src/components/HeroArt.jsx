// Original illustration: an engineer, a nurse and a new graduate standing together.
// Drawn for Bridgepath, so the project owns it outright.

function Person({ x, scale = 1, skin, hair, top, legs = '#1c2430', shoes = '#111827', children, hairShape }) {
  return (
    <g transform={`translate(${x} 420) scale(${scale})`}>
      {/* legs and shoes */}
      <rect x="-30" y="-100" width="24" height="92" rx="10" fill={legs} />
      <rect x="6" y="-100" width="24" height="92" rx="10" fill={legs} />
      <ellipse cx="-19" cy="-6" rx="17" ry="8" fill={shoes} />
      <ellipse cx="19" cy="-6" rx="17" ry="8" fill={shoes} />
      {/* arms behind the body */}
      <rect x="-58" y="-196" width="20" height="104" rx="10" fill={top} />
      <rect x="38" y="-196" width="20" height="104" rx="10" fill={top} />
      <circle cx="-48" cy="-90" r="10" fill={skin} />
      <circle cx="48" cy="-90" r="10" fill={skin} />
      {/* body, neck, head */}
      <rect x="-44" y="-204" width="88" height="116" rx="26" fill={top} />
      <rect x="-10" y="-222" width="20" height="22" rx="6" fill={skin} />
      <circle cx="0" cy="-246" r="28" fill={skin} />
      {hairShape ?? <path d="M-29 -250 a29 29 0 0 1 58 0 q-6 -14 -29 -14 q-23 0 -29 14z" fill={hair} />}
      {/* face */}
      <circle cx="-9" cy="-246" r="2.6" fill="#1c2430" />
      <circle cx="9" cy="-246" r="2.6" fill="#1c2430" />
      <path d="M-8 -234 q8 7 16 0" stroke="#1c2430" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {children}
    </g>
  )
}

export default function HeroArt() {
  return (
    <svg viewBox="0 0 520 460" className="h-auto w-full" role="img"
      aria-label="An engineer, a nurse and a new graduate standing together">
      {/* backdrop */}
      <path d="M70 120 C110 30 300 10 400 70 C500 130 510 300 430 380 C350 450 150 450 80 370 C20 300 30 200 70 120Z"
        className="fill-brand-soft" />
      <circle cx="430" cy="90" r="34" className="fill-accent-soft" />
      <circle cx="80" cy="380" r="18" className="fill-accent-soft" />
      <path d="M40 430 H480" stroke="#e7e1d8" strokeWidth="3" strokeLinecap="round" />

      {/* Engineer: hard hat, hi-vis vest, rolled plans */}
      <Person x={140} scale={0.92} skin="#f1c27d" hair="#4a3426" top="#1e3a5f" legs="#334155">
        <path d="M-30 -200 L-30 -96 L-12 -96 L-12 -200Z M12 -200 L12 -96 L30 -96 L30 -200Z" fill="#f59e0b" />
        <rect x="-30" y="-150" width="60" height="8" fill="#fde68a" />
        <path d="M-34 -262 a34 30 0 0 1 68 0 z" fill="#f59e0b" />
        <rect x="-40" y="-264" width="80" height="9" rx="4.5" fill="#d97706" />
        <rect x="44" y="-150" width="14" height="70" rx="7" fill="#e0f2fe" stroke="#93c5fd" strokeWidth="2"
          transform="rotate(-12 51 -115)" />
      </Person>

      {/* Graduate: cardigan, glasses, mortarboard, laptop */}
      <Person x={380} scale={0.94} skin="#8d5524" hair="#1f1b18" top="#b45309" legs="#3f3f46"
        hairShape={<g fill="#1f1b18">
          <circle cx="-20" cy="-262" r="14" /><circle cx="0" cy="-272" r="15" /><circle cx="20" cy="-262" r="14" />
          <circle cx="-27" cy="-245" r="10" /><circle cx="27" cy="-245" r="10" />
        </g>}>
        <rect x="-8" y="-204" width="16" height="116" fill="#fef3c7" />
        <circle cx="-9" cy="-246" r="8" fill="none" stroke="#1c2430" strokeWidth="2.2" />
        <circle cx="9" cy="-246" r="8" fill="none" stroke="#1c2430" strokeWidth="2.2" />
        <path d="M-1 -246 h2" stroke="#1c2430" strokeWidth="2.2" />
        <path d="M-40 -282 L0 -298 L40 -282 L0 -266Z" fill="#1c2430" />
        <rect x="-14" y="-280" width="28" height="12" rx="3" fill="#1c2430" />
        <path d="M30 -284 v22" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="30" cy="-260" r="4" fill="#f59e0b" />
        <rect x="-70" y="-134" width="50" height="34" rx="4" fill="#334155" />
        <rect x="-66" y="-130" width="42" height="26" rx="2" fill="#99f6e4" />
        <rect x="-76" y="-100" width="62" height="6" rx="3" fill="#475569" />
      </Person>

      {/* Nurse: scrubs, stethoscope, badge (front and center) */}
      <Person x={262} scale={1.02} skin="#c68642" hair="#2b1d14" top="#14b8a6" legs="#0f766e" shoes="#f8fafc"
        hairShape={<g fill="#2b1d14">
          <path d="M-29 -248 a29 29 0 0 1 58 0 q-4 -16 -29 -16 q-25 0 -29 16z" />
          <circle cx="0" cy="-282" r="11" />
        </g>}>
        <path d="M-16 -204 L0 -178 L16 -204" fill="none" stroke="#0f766e" strokeWidth="4" strokeLinejoin="round" />
        <path d="M-14 -200 C-24 -160 -6 -140 0 -140 C6 -140 24 -160 14 -200" fill="none" stroke="#1c2430"
          strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="0" cy="-136" r="7" fill="#94a3b8" stroke="#1c2430" strokeWidth="2.5" />
        <rect x="16" y="-170" width="20" height="14" rx="3" fill="#ffffff" />
        <path d="M22 -163 h8 M26 -167 v8" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
      </Person>
    </svg>
  )
}
