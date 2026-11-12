import { useState } from 'react'
import { artUrl } from '../data'
import type { Card } from '../data/types'
import styles from './CardArt.module.css'

// A card's 1909 art, upside down when reversed. If the image fails to load, the card's name shows instead of an empty frame.
export function CardArt({ card, alt, className, reversed = false }: { card: Card; alt: string; className?: string; reversed?: boolean }) {
  const [failed, setFailed] = useState(false)
  const classes = [failed && styles.fallback, reversed && styles.reversed, className].filter(Boolean).join(' ') || undefined
  if (failed) {
    return (
      <span className={classes} role="img" aria-label={alt || card.name}>
        {card.name}
      </span>
    )
  }
  return <img className={classes} src={artUrl(card.id)} alt={alt} draggable={false} onError={() => setFailed(true)} />
}
