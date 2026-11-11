import { useState } from 'react'
import { artUrl } from '../data'
import type { Card } from '../data/types'
import styles from './CardArt.module.css'

// A card's 1909 art. If the image fails to load, the card's name shows instead of an empty frame.
export function CardArt({ card, alt, className }: { card: Card; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className={`${styles.fallback} ${className ?? ''}`} role="img" aria-label={alt || card.name}>
        {card.name}
      </span>
    )
  }
  return <img className={className} src={artUrl(card.id)} alt={alt} draggable={false} onError={() => setFailed(true)} />
}
