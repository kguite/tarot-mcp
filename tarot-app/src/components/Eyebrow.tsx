import type { ReactNode } from 'react'
import styles from './Eyebrow.module.css'

// The small spaced-out capitals above or under a title: "Your reading", "Present", "Upright".
export function Eyebrow({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return <p className={gold ? `${styles.eyebrow} ${styles.gold}` : styles.eyebrow}>{children}</p>
}
