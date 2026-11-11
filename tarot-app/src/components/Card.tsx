import type { Card as CardData } from '../data/types'
import { Star } from './Star'
import styles from './Card.module.css'

// Face down needs no card; face up must have one. TypeScript checks which is which from `state`.
type CardProps =
  | { state: 'down'; label: string }
  | { state: 'resting' | 'chosen'; label: string; card: CardData; reversed?: boolean }

// The 1909 art lives in public/cards (credits in public/cards/CREDITS.md).
const artUrl =(id: string) => `${import.meta.env.BASE_URL}cards/${id}.webp`

export function Card(props: CardProps) {
  return (
    <figure className={`${styles.card} ${styles[props.state]}`}>
      <div className={styles.frame}>
        {props.state === 'down' ? (
          <div className={styles.back}>
            <Star size={34} center />
          </div>
        ) : (
          <img
            className={props.reversed ? `${styles.face} ${styles.reversed}` : styles.face}
            src={artUrl(props.card.id)}
            alt={props.reversed ? `${props.card.name}, reversed` : props.card.name}
          />
        )}
      </div>
      <figcaption className={styles.label}>{props.label}</figcaption>
    </figure>
  )
}
