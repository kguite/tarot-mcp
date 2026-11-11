import type { Card as CardData } from '../data/types'
import { Star } from './Star'
import styles from './Card.module.css'

// Face down needs no card; face up must have one. TypeScript checks which is which from `state`.
type CardProps =
  | { state: 'down'; label: string }
  | { state: 'resting' | 'chosen'; label: string; card: CardData; reversed?: boolean }

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV',
  'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']

export function Card(props: CardProps) {
  return (
    <figure className={`${styles.card} ${styles[props.state]}`}>
      <div className={styles.frame}>
        {props.state === 'down' ? (
          <div className={styles.back}>
            <Star size={34} center />
          </div>
        ) : (
          // Placeholder face until the 1909 art is hosted: the numeral and the name.
          <div className={props.reversed ? `${styles.face} ${styles.reversed}` : styles.face}>
            <span className={styles.numeral}>{props.card.arcana === 'major' ? ROMAN[props.card.number] : props.card.rank}</span>
            <span className={styles.name}>{props.card.name}</span>
          </div>
        )}
      </div>
      <figcaption className={styles.label}>{props.label}</figcaption>
    </figure>
  )
}
