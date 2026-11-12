import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { CARDS, SYMBOLS } from '../data'
import type { Card } from '../data/types'
import { Button, IconButton } from './Button'
import { CardArt } from './CardArt'
import { Eyebrow } from './Eyebrow'
import { Interpretations } from './Interpretations'
import { SymbolSheet } from './SymbolSheet'
import styles from './CardInspect.module.css'

type CardInspectProps = {
  card: Card
  // Only for a drawn card. Left out (Learn), the art is upright and no meaning is marked as the drawn one.
  reversed?: boolean
  context: string
  onClose: () => void
  onOpen: (card: Card) => void
  // Only where there is a reflection to write into; without it the button is left out.
  onWrite?: (prompt: string) => void
}

// A card up close: the art in its frame with rings on the tappable details, what's in the picture, and the figure.
// The parent gives it key={card.id}, so opening another card starts fresh.
export function CardInspect({ card, reversed, context, onClose, onOpen, onWrite }: CardInspectProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const zoomPoint = useRef({ x: 0.5, y: 0.5 })
  const [detailId, setDetailId] = useState<string | null>(null)
  const [symbolId, setSymbolId] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)

  // showModal gives the focus trap, Escape to close and the dimmed backdrop for free.
  // It focuses the first button (Close), which shows its focus ring; start on the title instead.
  useEffect(() => {
    dialog.current?.showModal()
    title.current?.focus()
  }, [])

  // After zooming in, scroll so the spot that was tapped stays in view.
  useLayoutEffect(() => {
    const box = viewport.current
    if (zoomed && box) {
      box.scrollLeft = zoomPoint.current.x * box.scrollWidth - box.clientWidth / 2
      box.scrollTop = zoomPoint.current.y * box.scrollHeight - box.clientHeight / 2
    }
  }, [zoomed])

  function toggleZoom(event?: MouseEvent) {
    if (event && !zoomed) {
      const rect = event.currentTarget.getBoundingClientRect()
      zoomPoint.current = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }
    }
    setZoomed(!zoomed)
  }

  const detail = card.details.find((d) => d.id === detailId)
  const symbol = SYMBOLS.find((s) => s.id === symbolId)
  const symbols = SYMBOLS.filter((s) => card.symbols.includes(s.id))
  const figure = [card.facing && `Facing ${card.facing}`, card.pose].filter(Boolean).join(' · ')

  return (
    <dialog ref={dialog} className={styles.dialog} onClose={onClose} aria-label={card.name}>
      <header className={styles.top}>
        <IconButton label="Close" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </IconButton>
        <div className={styles.title}>
          <h1 ref={title} tabIndex={-1} className={styles.name}>{card.name}</h1>
          <Eyebrow gold>{context}</Eyebrow>
        </div>
        <IconButton label={zoomed ? 'Zoom out' : 'Zoom in'} onClick={() => toggleZoom()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d={zoomed ? 'M20 20l-4-4M8 11h6' : 'M20 20l-4-4M11 8v6M8 11h6'} /></svg>
        </IconButton>
      </header>

      {/* The art, then the notes about it: stacked on a phone, side by side on a wide screen. */}
      <div className={styles.body}>
        <div className={styles.look}>
          <div className={styles.frame}>
            <div ref={viewport} className={zoomed ? `${styles.viewport} ${styles.zoomed}` : styles.viewport}>
              {/* Rings are placed in percent of this box, so they stay on the art when it zooms or turns over. */}
              <div className={reversed ? `${styles.art} ${styles.reversed}` : styles.art} onDoubleClick={toggleZoom}>
                <CardArt card={card} alt={reversed ? `${card.name}, reversed` : card.name} />
                {card.details.map((d) => (
                  <button
                    key={d.id}
                    className={d.id === detailId ? `${styles.ring} ${styles.selected}` : styles.ring}
                    style={{ left: `${d.region.x}%`, top: `${d.region.y}%` }}
                    aria-label={d.label}
                    aria-pressed={d.id === detailId}
                    onClick={() => setDetailId(d.id === detailId ? null : d.id)}
                  />
                ))}
              </div>
            </div>
          </div>
          <Eyebrow>
            {zoomed ? 'Scroll to look around' : card.details.length ? 'Tap a gold ring, or double-tap to zoom' : 'Double-tap or use the zoom button'}
          </Eyebrow>
        </div>

        {/* A picked symbol takes the notes' place: a sheet over the dialog on a phone, the right column on a wide screen. */}
        <div className={styles.notes}>
          {symbol ? (
            <SymbolSheet
              symbol={symbol}
              alsoIn={CARDS.filter((c) => c.id !== card.id && c.symbols.includes(symbol.id))}
              onPick={onOpen}
              onClose={() => setSymbolId(null)}
            />
          ) : (
            <>
              {detail && (
                <section className={styles.detail} aria-label="Selected detail">
                  <Eyebrow gold>{detail.label}</Eyebrow>
                  <p className={styles.prompt}>{detail.prompt}</p>
                  {onWrite && <Button variant="secondary" className={styles.write} onClick={() => onWrite(detail.prompt)}>Write from this</Button>}
                </section>
              )}

              <section className={styles.section}>
                <h2 className={styles.heading}>In this picture</h2>
                <div className={styles.chips}>
                  {symbols.map((s) => (
                    <button key={s.id} className={detail?.symbols.includes(s.id) ? `${styles.chip} ${styles.lit}` : styles.chip} onClick={() => setSymbolId(s.id)}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </section>

              {figure && (
                <section className={styles.section}>
                  <h2 className={styles.heading}>The figure</h2>
                  <p className={styles.figure}>{figure}</p>
                </section>
              )}

              <section className={styles.section}>
                <h2 className={styles.heading}>Interpretations</h2>
                <Interpretations card={card} reversed={reversed} />
              </section>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
