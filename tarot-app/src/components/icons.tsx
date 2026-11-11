// Line icons for the navigation. Decorative: the label next to each one says what it is.
const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const SunIcon = () => (
  <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></svg>
)

export const BookIcon = () => (
  <svg {...props}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6" /></svg>
)

export const CardsIcon = () => (
  <svg {...props}><rect x="3" y="5" width="8" height="14" rx="1" /><rect x="13" y="5" width="8" height="14" rx="1" /></svg>
)

export const SlidersIcon = () => (
  <svg {...props}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
)

// Suit marks for the Learn filter, drawn to match the line icons above.
export const WandIcon = () => (
  <svg {...props}><path d="M7 21L17 5" /><path d="M17 5l1.5-2M15.5 7.5l2.5-.5M13.6 10.5l-2-1" /></svg>
)

export const CupIcon = () => (
  <svg {...props}><path d="M6 4h12v3a6 6 0 0 1-12 0z" /><path d="M12 13v5M8 20h8" /></svg>
)

export const SwordIcon = () => (
  <svg {...props}><path d="M12 2v14M8 16h8M12 16v5" /><path d="M10.5 4.5L12 2l1.5 2.5" /></svg>
)

export const PentacleIcon = () => (
  <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 5l4 12-10-7.5h12L8 17z" /></svg>
)
