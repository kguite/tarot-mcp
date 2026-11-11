import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '../components/Button'
import { CardInspect } from '../components/CardInspect'
import { Eyebrow } from '../components/Eyebrow'
import { FlipCard } from '../components/FlipCard'
import { Ornament } from '../components/Ornament'
import { ReadingPanel } from '../components/ReadingPanel'
import { Star } from '../components/Star'
import { TextField } from '../components/TextField'
import type { Card } from '../data/types'
import { isFinished, newReading } from '../lib/deck'
import type { Reading } from '../lib/deck'
import { saveReading, updateInterpretation } from '../lib/store'
import screen from './Screen.module.css'
import styles from './Draw.module.css'

const FAN = 7

type Inspecting = { card: Card; reversed: boolean; context: string }

// Three taps per card: pick it from the fan, turn it over, then tap again for its meaning.
// The reading itself lives in App (so switching tabs keeps it); only what's open on screen lives here.
export function Draw({ reading, onChange }: { reading: Reading; onChange: (reading: Reading) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const [inspecting, setInspecting] = useState<Inspecting | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { spread, draws, phases, picked, reflection } = reading

  const placed = picked.length
  const left = draws.length - placed
  const turned = phases.filter((p) => p === 'up').length

  function pick(fanIndex: number) {
    if (left === 0 || picked.includes(fanIndex)) return
    onChange({ ...reading, picked: [...picked, fanIndex], phases: phases.map((p, i) => (i === placed ? 'down' : p)) })
  }

  function tap(i: number) {
    if (phases[i] === 'down') {
      onChange({ ...reading, phases: phases.map((p, j) => (j === i ? 'up' : p)) })
      setOpen(null)
    } else {
      setOpen(open === i ? null : i)
    }
  }

  function startOver() {
    onChange(newReading(spread))
    setOpen(null)
  }

  // The first save creates the reading in the journal; later saves update its reflection.
  async function save() {
    try {
      let savedId = reading.savedId
      if (savedId) {
        await updateInterpretation(savedId, reflection)
      } else {
        const cards = draws.map((d) => ({ positionId: d.position.id, cardId: d.card.id, reversed: d.reversed }))
        savedId = await saveReading(spread.id, cards, reflection)
      }
      onChange({ ...reading, savedId, savedReflection: reflection })
      setSaveError(null)
    } catch (error) {
      setSaveError((error as Error).message)
    }
  }

  const hint =
    left > 0 ? `Choose ${left} ${left === 1 ? (placed ? 'more card' : 'card') : 'cards'}`
    : turned === 0 ? 'Tap a card to turn it over'
    : open === null && turned < draws.length ? 'Look at the picture first. Tap it again for its meaning.'
    : ''
  const shown = open === null ? null : draws[open]

  return (
    <div className={screen.screen}>
      <div className={screen.title}>
        <Eyebrow gold>Your reading</Eyebrow>
        <h1>{spread.name}</h1>
        <Ornament />
      </div>

      <div className={styles.spread} style={{ gridTemplateColumns: `repeat(${Math.min(draws.length, 4)}, minmax(0, 150px))` }}>
        {draws.map((draw, i) =>
          phases[i] === 'empty' ? (
            <figure key={i} className={styles.empty}>
              <span className={styles.outline} />
              <figcaption>{draw.position.name}</figcaption>
            </figure>
          ) : (
            <FlipCard
              key={i}
              card={draw.card}
              reversed={draw.reversed}
              faceUp={phases[i] === 'up'}
              selected={open === i}
              label={draw.position.name}
              onTap={() => tap(i)}
            />
          ),
        )}
      </div>

      {hint && <p className={styles.hint}>{hint}</p>}

      {left > 0 && (
        <div className={styles.fan}>
          {Array.from({ length: FAN }, (_, k) => (
            <button
              key={k}
              className={picked.includes(k) ? `${styles.fanCard} ${styles.gone}` : styles.fanCard}
              style={{ '--angle': `${-27 + k * 9}deg` } as CSSProperties}
              onClick={() => pick(k)}
              aria-label="Choose this card"
              disabled={picked.includes(k)}
            >
              <span className={styles.fanBack}>
                <Star size={22} />
              </span>
            </button>
          ))}
        </div>
      )}

      {shown && (
        <div className={styles.meaning}>
          <ReadingPanel card={shown.card} reversed={shown.reversed} position={shown.position.name} question={shown.position.prompt} />
          <Button
            variant="secondary"
            onClick={() => setInspecting({ card: shown.card, reversed: shown.reversed, context: `${shown.position.name} · ${shown.reversed ? 'reversed' : 'upright'}` })}
          >
            Look closer
          </Button>
        </div>
      )}

      {left === 0 && (
        <>
          <TextField
            label="Your reflection"
            placeholder="Write whatever comes up. There’s no wrong answer."
            value={reflection}
            onChange={(e) => onChange({ ...reading, reflection: e.target.value })}
          />
          <div className={styles.actions}>
            <Button variant="secondary" onClick={startOver}>Start over</Button>
            <Button onClick={save} disabled={isFinished(reading)}>
              {isFinished(reading) ? 'Saved' : reading.savedId ? 'Save changes' : 'Save reading'}
            </Button>
          </div>
          {saveError && <p className={styles.error} role="alert">{saveError}</p>}
        </>
      )}

      {inspecting && (
        <CardInspect
          key={inspecting.card.id}
          card={inspecting.card}
          reversed={inspecting.reversed}
          context={inspecting.context}
          onClose={() => setInspecting(null)}
          onOpen={(card) => setInspecting({ card, reversed: false, context: 'Also in' })}
          onWrite={(prompt) => {
            // Like the prototype: add the question to the reflection, on its own line.
            const text = reflection.trim() ? `${reflection.trimEnd()}\n\n${prompt}\n` : `${prompt}\n`
            onChange({ ...reading, reflection: text })
            setInspecting(null)
          }}
        />
      )}
    </div>
  )
}
