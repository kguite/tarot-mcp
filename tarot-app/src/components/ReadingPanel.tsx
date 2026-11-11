import type { Card } from '../data/types'
import { Eyebrow } from './Eyebrow'
import { Keywords } from './Keywords'
import styles from './ReadingPanel.module.css'

type ReadingPanelProps = {
  card: Card
  reversed: boolean
  position: string
  question: string
}

// The framed panel under a spread: the card, its summary and keywords for this orientation, and the position's question.
export function ReadingPanel({ card, reversed, position, question }: ReadingPanelProps) {
  return (
    <section className={styles.panel} aria-label={`${position}: ${card.name}`}>
      <div className={styles.heading}>
        <h2 className={styles.name}>{card.name}</h2>
        <Eyebrow>{reversed ? 'Reversed' : 'Upright'}</Eyebrow>
      </div>
      <p className={styles.summary}>{card.summary}</p>
      <Keywords words={reversed ? card.keywords.reversed : card.keywords.upright} />
      <hr className={styles.rule} />
      <p className={styles.question}>
        <span className={styles.asks}>{position} asks:</span> {question}
      </p>
    </section>
  )
}
