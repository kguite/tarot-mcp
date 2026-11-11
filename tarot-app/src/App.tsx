import { Button, IconButton } from './components/Button'
import { Card } from './components/Card'
import { Eyebrow } from './components/Eyebrow'
import { Keywords } from './components/Keywords'
import { Ornament } from './components/Ornament'
import { ReadingPanel } from './components/ReadingPanel'
import { TextField } from './components/TextField'
import { CARDS, SPREADS } from './data'
import styles from './App.module.css'

// Temporary: a gallery of the shared components, until the prototype is ported screen by screen.
const byId = (id: string) => CARDS.find((c) => c.id === id)!
const spread = SPREADS.find((s) => s.id === 'past-present-future')!
const [past, present, future] = spread.positions

function App() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <IconButton label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </IconButton>
        <IconButton label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </IconButton>
      </header>

      <div className={styles.title}>
        <Eyebrow gold>Your reading</Eyebrow>
        <h1>{spread.name}</h1>
        <Ornament />
      </div>

      <div className={styles.spread}>
        <Card state="resting" label={past.name} card={byId('seven-of-wands')} />
        <Card state="chosen" label={present.name} card={byId('moon')} />
        <Card state="resting" label={future.name} card={byId('queen-of-cups')} reversed />
      </div>

      <ReadingPanel card={byId('moon')} reversed={false} position={present.name} question={present.prompt} />
      <TextField label="Your reflection" placeholder="Write whatever comes up. There’s no wrong answer." />
      <div className={styles.actions}>
        <Button variant="secondary">Shuffle</Button>
        <Button>Save</Button>
      </div>

      <h2 className={styles.section}>Card states</h2>
      <div className={styles.spread}>
        <Card state="down" label="Choose" />
        <Card state="resting" label="Resting" card={byId('star')} />
        <Card state="chosen" label="Chosen" card={byId('star')} />
      </div>

      <h2 className={styles.section}>Keywords, reversed</h2>
      <Keywords words={byId('moon').keywords.reversed} />
    </main>
  )
}

export default App
