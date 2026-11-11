import styles from './Keywords.module.css'

export function Keywords({ words }: { words: string[] }) {
  return <p className={styles.keywords}>{words.join(' · ')}</p>
}
