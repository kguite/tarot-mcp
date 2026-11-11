import type { Card as CardData } from '../data/types'
import { CardArt } from './CardArt'
import { Star } from './Star'
import styles from './Card.module.css'

// Face down needs no card; face up must have one. TypeScript checks which is which from `state`.
// onOpen makes a face-up card a button (it opens the inspect view).
type CardProps =
  | { state: 'down'; label: string }
  | { state: 'resting' | 'chosen'; label: string; card: CardData; reversed?: boolean; onOpen?: () => void }

export function Card(props: CardProps) {
  if (props.state === 'down') {
    return (
      <figure className={`${styles.card} ${styles.down}`}>
        <div className={styles.frame}>
          <div className={styles.back}>
            <Star size={34} center />
          </div>
        </div>
        <figcaption className={styles.label}>{props.label}</figcaption>
      </figure>
    )
  }

  const name = props.reversed ? `${props.card.name}, reversed` : props.card.name
  const face = <CardArt card={props.card} alt={name} className={props.reversed ? `${styles.face} ${styles.reversed}` : styles.face} />
  return (
    <figure className={`${styles.card} ${styles[props.state]}`}>
      {props.onOpen ? (
        <button className={`${styles.frame} ${styles.button}`} onClick={props.onOpen} aria-label={`Look closer at ${name}`}>
          {face}
        </button>
      ) : (
        <div className={styles.frame}>{face}</div>
      )}
      <figcaption className={styles.label}>{props.label}</figcaption>
    </figure>
  )
}
