import { useEffect, useState } from 'react'
import { SPREADS, WAITE } from '../data'
import type { Card } from '../data/types'
import { reflectionOf, when } from '../lib/readings'
import { listReadings } from '../lib/store'
import type { SavedReading } from '../lib/store'
import { Eyebrow } from './Eyebrow'
import styles from './Interpretations.module.css'

// Other voices on a card, each labeled as whose it is: Waite's 1911 meanings (public domain), then
// your own reflections from the journal. The meaning for the way the card was drawn is lit.
export function Interpretations({ card, reversed }: { card: Card; reversed?: boolean }) {
  const waite = WAITE.cards.find((w) => w.id === card.id)
  const [mine, setMine] = useState<SavedReading[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listReadings(card.id).then(setMine, (e: Error) => setError(e.message))
  }, [card.id])

  return (
    <div className={styles.voices}>
      {waite && (
        <article className={styles.voice}>
          <Eyebrow gold>Waite, 1911</Eyebrow>
          <p className={reversed === false ? styles.lit : undefined}>
            <span className={styles.which}>Upright</span> {waite.upright}
          </p>
          {waite.reversed && (
            <p className={reversed ? styles.lit : undefined}>
              <span className={styles.which}>Reversed</span> {waite.reversed}
            </p>
          )}
          <details>
            <summary>What he saw in the picture</summary>
            <p>{waite.description}</p>
          </details>
          <p className={styles.credit}>
            {WAITE.source.author}, <cite>{WAITE.source.title}</cite>. Public domain.
          </p>
        </article>
      )}

      <article className={styles.voice}>
        <Eyebrow gold>Your reflections</Eyebrow>
        {error && <p className={styles.muted}>{error}</p>}
        {mine?.length === 0 && <p className={styles.muted}>You haven’t written about this card yet.</p>}
        {mine && mine.length > 0 && (
          <ul className={styles.mine}>
            {mine.map((r) => {
              const drawn = r.cards.find((c) => c.card_id === card.id)!
              const position = SPREADS.find((s) => s.id === r.spread_id)?.positions.find((p) => p.id === drawn.position_id)?.name
              return (
                <li key={r.id}>
                  <span className={styles.when}>
                    {when(r.created_at)}{position && ` · ${position}`}{drawn.reversed && ' · reversed'}
                  </span>
                  {reflectionOf(r) || <span className={styles.muted}>No reflection written.</span>}
                </li>
              )
            })}
          </ul>
        )}
      </article>
    </div>
  )
}
