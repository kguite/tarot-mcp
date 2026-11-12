import { useEffect, useRef } from 'react'
import { SPREADS } from '../data'
import type { Reading } from '../lib/deck'
import { CardArt } from './CardArt'
import { Eyebrow } from './Eyebrow'
import { Star } from './Star'
import styles from './DrawSheet.module.css'

// The Celtic Cross (level 4) waits for its own layout.
const SPREAD_CHOICES = SPREADS.filter((s) => s.level <= 3)

type DrawSheetProps = {
  reading: Reading | null
  onContinue: () => void
  onStart: (spreadId: string) => void
  onClose: () => void
}

// What the Draw star opens: carry on with the reading in progress, or start a new one.
// Asking first means one tap on the star never throws away an unfinished reading.
export function DrawSheet({ reading, onContinue, onStart, onClose }: DrawSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
    title.current?.focus()
  }, [])

  return (
    // A tap on the dimmed backdrop lands on the dialog itself, so it closes the sheet.
    <dialog ref={dialog} className={styles.dialog} onClose={onClose} onClick={(e) => e.target === dialog.current && onClose()} aria-label="Draw">
      <div className={styles.sheet}>
        <span className={styles.handle} />
        <h2 ref={title} tabIndex={-1} className={styles.title}>Draw</h2>

        {reading && (
          <button className={styles.continue} onClick={onContinue}>
            <span className={styles.thumbs}>
              {reading.draws.map((draw, i) => (
                <span key={i} className={`${styles.thumb} ${styles[reading.phases[i]]}`}>
                  {reading.phases[i] === 'up' && <CardArt card={draw.card} alt="" reversed={draw.reversed} />}
                  {reading.phases[i] === 'down' && <Star size={12} />}
                </span>
              ))}
            </span>
            <span className={styles.text}>
              <Eyebrow gold>Continue your reading</Eyebrow>
              <span className={styles.name}>{reading.spread.name}</span>
            </span>
          </button>
        )}

        <div className={styles.list}>
          <Eyebrow>Start a new reading</Eyebrow>
          {SPREAD_CHOICES.map((spread) => (
            <button key={spread.id} className={styles.row} onClick={() => onStart(spread.id)}>
              <span className={styles.name}>{spread.id === 'single' ? 'Your card for the day' : spread.name}</span>
              <span className={styles.count}>{spread.positions.length === 1 ? '1 card' : `${spread.positions.length} cards`}</span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  )
}
