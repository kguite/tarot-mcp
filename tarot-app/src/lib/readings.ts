// Small helpers for showing saved readings, shared by the Journal and the card view.
import type { SavedReading } from './store'

export const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export const reflectionOf = (r: SavedReading) => r.entries.find((e) => e.type === 'interpretation')?.body ?? ''
