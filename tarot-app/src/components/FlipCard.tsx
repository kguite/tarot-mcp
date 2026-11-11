import type { Card } from '../data/types'
import { CardArt } from './CardArt'
import { Star } from './Star'
import styles from './FlipCard.module.css'

type FlipCardProps = {
  card: Card
  reversed: boolean
  faceUp: boolean
  selected: boolean
  label: string
  onTap: () => void
}

// A drawn card in its spot: face down until tapped, then turned over with a 3D spring.
// Both faces are always there; turning the inner box 180 degrees shows the other one.
export function FlipCard({ card, reversed, faceUp, selected, label, onTap }: FlipCardProps) {
  const name = reversed ? `${card.name}, reversed` : card.name
  const action = !faceUp ? `Turn over the ${label} card` : selected ? `Hide the meaning of ${name}` : `Show the meaning of ${name}`
  return (
    <figure className={selected ? `${styles.slot} ${styles.selected}` : styles.slot}>
      <button className={styles.frame} onClick={onTap} aria-label={action}>
        <span className={faceUp ? `${styles.flipper} ${styles.up}` : styles.flipper}>
          <span className={`${styles.face} ${styles.back}`}>
            <Star size={28} center />
          </span>
          <span className={`${styles.face} ${styles.front}`}>
            <CardArt card={card} alt="" className={reversed ? styles.reversed : undefined} />
          </span>
        </span>
      </button>
      <figcaption className={styles.label}>{label}</figcaption>
    </figure>
  )
}
