import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CardArt } from '../components/CardArt'
import { CardInspect } from '../components/CardInspect'
import { Eyebrow } from '../components/Eyebrow'
import { TextField } from '../components/TextField'
import { CARDS, SPREADS } from '../data'
import type { Card as CardData } from '../data/types'
import { listReadings, updateInterpretation } from '../lib/store'
import type { SavedReading } from '../lib/store'
import screen from './Screen.module.css'
import styles from './Journal.module.css'

const cardById = (id: string) => CARDS.find((c) => c.id === id)!
const spreadById = (id: string) => SPREADS.find((s) => s.id === id)
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const reflectionOf = (r: SavedReading) => r.entries.find((e) => e.type === 'interpretation')?.body ?? ''

// Your saved readings, newest first. Tap one to see its cards and edit its reflection.
export function Journal() {
  const [readings, setReadings] = useState<SavedReading[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    listReadings().then(setReadings)
  }, [])

  const open = readings?.find((r) => r.id === openId)
  if (open) {
    return <SavedReadingView reading={open} onBack={() => setOpenId(null)} onSaved={() => listReadings().then(setReadings)} />
  }

  return (
    <div className={screen.screen}>
      <div className={screen.title}>
        <Eyebrow gold>Journal</Eyebrow>
        <h1>Your readings</h1>
      </div>
      {readings?.length === 0 && <p className={screen.note}>No saved readings yet. Draw some cards and save the reading.</p>}
      {readings?.map((r) => (
        <button key={r.id} className={styles.row} onClick={() => setOpenId(r.id)}>
          <span className={styles.thumbs}>
            {r.cards.map((c) => (
              <CardArt key={c.position} card={cardById(c.card_id)} alt="" className={c.reversed ? `${styles.thumb} ${styles.reversed}` : styles.thumb} />
            ))}
          </span>
          <span className={styles.text}>
            <span className={styles.name}>{spreadById(r.spread_id)?.name ?? r.spread_id}</span>
            <span className={styles.meta}>{when(r.created_at)}</span>
            {reflectionOf(r) && <span className={styles.excerpt}>{reflectionOf(r)}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

function SavedReadingView({ reading, onBack, onSaved }: { reading: SavedReading; onBack: () => void; onSaved: () => void }) {
  const [reflection, setReflection] = useState(reflectionOf(reading))
  const [inspecting, setInspecting] = useState<{ card: CardData; reversed: boolean; context: string } | null>(null)
  const spread = spreadById(reading.spread_id)
  const changed = reflection !== reflectionOf(reading)

  return (
    <div className={screen.screen}>
      <button className={styles.back} onClick={onBack}>‹ Your readings</button>
      <div className={screen.title}>
        <Eyebrow gold>{when(reading.created_at)}</Eyebrow>
        <h1>{spread?.name ?? reading.spread_id}</h1>
      </div>
      <div className={styles.cards} style={{ gridTemplateColumns: `repeat(${Math.min(reading.cards.length, 4)}, minmax(0, 150px))` }}>
        {reading.cards.map((c) => {
          const card = cardById(c.card_id)
          const position = spread?.positions.find((p) => p.id === c.position_id)?.name ?? c.position_id
          return (
            <Card
              key={c.position}
              state="resting"
              label={position}
              card={card}
              reversed={c.reversed}
              onOpen={() => setInspecting({ card, reversed: c.reversed, context: `${position} · ${c.reversed ? 'reversed' : 'upright'}` })}
            />
          )
        })}
      </div>
      <TextField label="Your reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} />
      <Button disabled={!changed} onClick={() => updateInterpretation(reading.id, reflection).then(onSaved)}>
        {changed ? 'Save changes' : 'Saved'}
      </Button>
      {inspecting && (
        <CardInspect
          key={inspecting.card.id}
          card={inspecting.card}
          reversed={inspecting.reversed}
          context={inspecting.context}
          onClose={() => setInspecting(null)}
          onOpen={(card) => setInspecting({ card, reversed: false, context: 'Also in' })}
        />
      )}
    </div>
  )
}
