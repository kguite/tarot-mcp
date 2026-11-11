import type { ReactNode } from 'react'
import { BookIcon, CardsIcon, SlidersIcon, SunIcon } from './icons'
import { Star } from './Star'
import styles from './Nav.module.css'

export type Page = 'today' | 'journal' | 'draw' | 'learn' | 'settings'

const ITEMS: { page: Page; label: string; icon: ReactNode }[] = [
  { page: 'today', label: 'Today', icon: <SunIcon /> },
  { page: 'journal', label: 'Journal', icon: <BookIcon /> },
  { page: 'draw', label: 'Draw', icon: <Star size={26} /> },
  { page: 'learn', label: 'Learn', icon: <CardsIcon /> },
  { page: 'settings', label: 'Settings', icon: <SlidersIcon /> },
]

// One component, two layouts from the CSS alone: a bottom bar with Draw as a raised star on a phone,
// an always-open sidebar on a wide screen.
export function Nav({ current, onGo }: { current: Page; onGo: (page: Page) => void }) {
  return (
    <nav className={styles.nav} aria-label="Main">
      <p className={styles.brand}>Tarot</p>
      <ul className={styles.items}>
        {ITEMS.map((item) => (
          <li key={item.page}>
            <button
              className={item.page === 'draw' ? `${styles.item} ${styles.draw}` : styles.item}
              aria-current={current === item.page ? 'page' : undefined}
              onClick={() => onGo(item.page)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.credit}>Card art by Pamela Colman Smith, 1909.</p>
    </nav>
  )
}
