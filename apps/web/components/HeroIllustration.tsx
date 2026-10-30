/** Stylised map: a person's trip to a dialysis clinic, with the route broken by a reported outage. */
export function HeroIllustration() {
  return (
    <figure className="hero-art">
      <svg viewBox="0 0 560 420" role="img" aria-labelledby="hero-art-title hero-art-desc">
        <title id="hero-art-title">A route to a dialysis clinic with a reported elevator outage</title>
        <desc id="hero-art-desc">
          A map showing a home on the left, a clinic on the right, and a direct route that is blocked by a reported
          elevator outage. A dashed alternative route goes around the blockage.
        </desc>
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#d9e6e3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="420" rx="24" fill="#eef6f4" />
        <rect width="560" height="420" rx="24" fill="url(#grid)" />
        <path d="M0 300c80-30 150 20 240-20s170-90 320-60V420H0Z" fill="#cfe6ee" opacity=".7" />
        <path d="M40 150H240L360 262H500" fill="none" stroke="#fff" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />

        {/* usual route, broken at the outage */}
        <path d="M70 150H240L282 189" fill="none" stroke="#0b4f56" strokeWidth="6" strokeLinecap="round" />
        <path d="M322 221L360 262H470" fill="none" stroke="#9db9b6" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 11" />

        {/* alternative route */}
        <path d="M285 214c10 55 50 86 120 86h70" fill="none" stroke="#e58a00" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 9" />

        {/* home */}
        <g transform="translate(40 120)">
          <circle cx="30" cy="30" r="30" fill="#fff" stroke="#0b4f56" strokeWidth="3" />
          <path d="M16 32 30 19l14 13v13H16Z" fill="#0b4f56" />
          <rect x="26" y="34" width="8" height="11" fill="#fff" />
        </g>
        <text x="70" y="206" textAnchor="middle" className="art-label">Home</text>

        {/* clinic */}
        <g transform="translate(470 235)">
          <circle cx="30" cy="30" r="30" fill="#fff" stroke="#0b4f56" strokeWidth="3" />
          <rect x="17" y="18" width="26" height="26" rx="4" fill="#0b4f56" />
          <path d="M30 23v16M22 31h16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </g>
        <text x="500" y="318" textAnchor="middle" className="art-label">Dialysis clinic</text>

        {/* outage marker */}
        <g transform="translate(278 168)">
          <circle cx="22" cy="22" r="22" fill="#c8321f" />
          <circle cx="22" cy="22" r="22" fill="none" stroke="#c8321f" strokeWidth="2" opacity=".35">
            <animate attributeName="r" values="22;34" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".45;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <path d="M22 11v14M22 30v2" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* status chips */}
        <g transform="translate(110 20)">
          <rect width="230" height="46" rx="12" fill="#fff" stroke="#e1c7c2" />
          <circle cx="24" cy="23" r="7" fill="#c8321f" />
          <text x="42" y="20" className="art-chip-title">Elevator out of service</text>
          <text x="42" y="36" className="art-chip-sub">Community reported · unverified</text>
        </g>
        <g transform="translate(300 346)">
          <rect width="236" height="52" rx="12" fill="#fff" stroke="#f0d6a6" />
          <circle cx="24" cy="26" r="7" fill="#e58a00" />
          <text x="42" y="22" className="art-chip-title">Step-free route found</text>
          <text x="42" y="39" className="art-chip-sub">+11 min · needs human approval</text>
        </g>
      </svg>
      <figcaption>Illustration of a scenario. Not live data.</figcaption>
    </figure>
  );
}
