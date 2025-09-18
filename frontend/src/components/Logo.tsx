import React from 'react'

type LogoProps = {
  size?: number
  withWordmark?: boolean
}

export function Logo({ size = 36, withWordmark = false }: LogoProps) {
  const s = size
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={s} height={s} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="RTRWH logo">
        <defs>
          <linearGradient id="lg1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="lg2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        {/* Droplet */}
        <path d="M32 6 C28 14 18 24 18 34 a14 14 0 0 0 28 0 c0-10-10-20-14-28z" fill="url(#lg1)" />
        {/* Ground / aquifer layers */}
        <g transform="translate(0,38)">
          <rect x="10" y="0" width="44" height="6" rx="3" fill="#94a3b8" />
          <rect x="14" y="8" width="36" height="6" rx="3" fill="#cbd5e1" />
          <rect x="18" y="16" width="28" height="6" rx="3" fill="url(#lg2)" />
        </g>
        {/* Sparkle */}
        <circle cx="44" cy="14" r="2" fill="#93c5fd" />
      </svg>
      {withWordmark && (
        <span className="font-semibold tracking-tight text-slate-800">RTRWH</span>
      )}
    </div>
  )
}


