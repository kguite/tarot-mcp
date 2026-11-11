import { Card } from '../components/Card'
import { Eyebrow } from '../components/Eyebrow'
import { Ornament } from '../components/Ornament'
import { SPREADS } from '../data'
import screen from './Screen.module.css'
import styles from './Today.module.css'

// The Celtic Cross (level 4) waits for its own layout, as in the prototype; the one-card spread is the daily card.
const STARTS = SPREADS.filter((s) => s.level <= 3 && s.id !== 'single')

export function Today({ onStart }: { onStart: (spreadId: string) => void }) {
  return (
    <div className={screen.screen}>
      <div className={screen.title}>
        <Eyebrow gold>Today</Eyebrow>
        <h1>Your card for the day</h1>
        <Ornament />
      </div>

      <button className={styles.daily} onClick={() => onStart('single')}>
        <Card state="down" label="Tap to draw" />
      </button>

      <section className={styles.section}>
        <h2 className={screen.heading}>Start a reading</h2>
        {STARTS.map((spread) => (
          <button key={spread.id} className={styles.row} onClick={() => onStart(spread.id)}>
            <span className={styles.name}>{spread.name}</span>
            <span className={styles.count}>{spread.positions.length} cards</span>
          </button>
        ))}
      </section>
    </div>
  )
}
