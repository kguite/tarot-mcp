import { Star } from './Star'
import styles from './Ornament.module.css'

// The gold rule with a star in the middle, used under titles.
export function Ornament() {
  return (
    <div className={styles.ornament}>
      <span className={styles.rule} />
      <Star />
      <span className={styles.rule} />
    </div>
  )
}
