// The four-pointed star used by the divider and the card back. Decorative, so hidden from screen readers.
export function Star({ size = 12, center = false }: { size?: number; center?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={size > 20 ? 1.2 : 1.6} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" />
      {center && <circle cx="12" cy="12" r="3.2" />}
    </svg>
  )
}
