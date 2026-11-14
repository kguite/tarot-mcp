import { useAuth0 } from '@auth0/auth0-react'
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

type Inspecting = { card: Card; reversed?: boolean; context: string }

// Three taps per card: pick it from the fan, turn it over, then tap again for its meaning.
// The reading itself lives in App (so switching tabs keeps it); only what's open on screen lives here.
export function Draw({ reading, onChange }: { reading: Reading; onChange: (reading: Reading) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const [inspecting, setInspecting] = useState<Inspecting | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth0()
  const { spread, draws, phases, picked, reflection } = reading

  const placed = picked.length
  const left = draws.length - placed
  const turned = phases.filter((p) => p === 'up').length

  // From the fan, the card goes in the next empty spot; from an outline, in that spot.
  function pick(fanIndex: number, slot = phases.indexOf('empty')) {
    if (phases[slot] !== 'empty' || picked.includes(fanIndex)) return
    onChange({ ...reading, picked: [...picked, fanIndex], phases: phases.map((p, i) => (i === slot ? 'down' : p)) })
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
        const cards = draws.map((d) => ({ cardId: d.card.id, reversed: d.reversed }))
        savedId = await saveReading(spread.id, cards, reflection)
      }
      onChange({ ...reading, savedId, savedReflection: reflection })
      setSaveError(null)
    } catch (error) {
      setSaveError((error as Error).message)
    }
  }

  // Until a meaning is open, always say what to tap next. Once every card was face up (straight away
  // in a one-card draw), it used to say nothing, and the meaning was easy to miss.
  const hint =
    left > 0 ? `Choose ${left} ${left === 1 ? (placed ? 'more card' : 'card') : 'cards'}`
    : turned === 0 ? 'Tap a card to turn it over'
    : open === null ? 'Look at the picture first. Tap it again for its meaning.'
    : ''
  const shown = open === null ? null : draws[open]

  return (
    <div className={`${screen.screen} ${screen.wide}`}>
      <div className={screen.title}>
        <Eyebrow gold>Your reading</Eyebrow>
        <h1>{spread.name}</h1>
        <Ornament />
      </div>

      {/* Two columns on a wide screen, stacked on a phone. Left: the cards and what they mean.
          Right: the fan while choosing, then the journal (reflection and save). */}
      <div
        className={left > 0 || !isAuthenticated ? `${styles.stage} ${styles.oneColumn}` : styles.stage}
        style={{ '--cols': Math.min(draws.length, 4) } as CSSProperties}
      >
        <div className={styles.side}>
          <div className={styles.spread}>
            {draws.map((draw, i) =>
              phases[i] === 'empty' ? (
                // FAN + i is past the fan's cards, so drawing from an outline doesn't take one from the fan.
                <button key={i} className={styles.empty} onClick={() => pick(FAN + i, i)} aria-label={`Draw a card for ${draw.position.name}`}>
                  <span className={styles.outline} />
                  <span className={styles.caption}>{draw.position.name}</span>
                </button>
              ) : (
                <FlipCard
                  key={i}
                  card={draw.card}
                  reversed={draw.reversed}
                  faceUp={phases[i] === 'up'}
                  selected={open === i}
                  label={draw.position.name}
                  onTap={() => tap(i)}
                  onLookCloser={() => {
                    // A one-card reading's only position is "The card", which says nothing here.
                    const orientation = draw.reversed ? 'reversed' : 'upright'
                    setInspecting({ card: draw.card, reversed: draw.reversed, context: draws.length > 1 ? `${draw.position.name} · ${orientation}` : orientation })
                  }}
                />
              ),
            )}
          </div>
          {left === 0 && hint && <p className={styles.hint}>{hint}</p>}
          {shown && (
            <div className={styles.meaning}>
              <ReadingPanel card={shown.card} reversed={shown.reversed} position={shown.position.name} question={shown.position.prompt} />
            </div>
          )}
        </div>

        <div className={styles.side}>
          {left > 0 && hint && <p className={styles.hint}>{hint}</p>}
          {left > 0 ? (
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
          ) : !isAuthenticated ? (
            // No reflection box: logging in reloads the page, so anything written before it would be lost.
            <div className={styles.loggedOut}>
              <div className={styles.actions}>
                <Button variant="secondary" onClick={startOver}>Draw again</Button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.journal}>
                <TextField
                  label="Your reflection"
                  placeholder="Write whatever comes up. There’s no wrong answer."
                  value={reflection}
                  onChange={(e) => onChange({ ...reading, reflection: e.target.value })}
                />
              </div>
              <div className={styles.actions}>
                <Button variant="secondary" onClick={startOver}>Draw again</Button>
                <Button onClick={save} disabled={isFinished(reading)}>
                  {isFinished(reading) ? 'Saved' : reading.savedId ? 'Save changes' : 'Save reading'}
                </Button>
              </div>
              {saveError && <p className={screen.error} role="alert">{saveError}</p>}
            </>
          )}
        </div>
      </div>

      {inspecting && (
        <CardInspect
          key={inspecting.card.id}
          card={inspecting.card}
          reversed={inspecting.reversed}
          context={inspecting.context}
          onClose={() => setInspecting(null)}
          onOpen={(card) => setInspecting({ card, context: 'Also in' })}
          onWrite={isAuthenticated ? (prompt) => {
            // Like the prototype: add the question to the reflection, on its own line.
            const text = reflection.trim() ? `${reflection.trimEnd()}\n\n${prompt}\n` : `${prompt}\n`
            onChange({ ...reading, reflection: text })
            setInspecting(null)
          } : undefined}
        />
      )}
    </div>
  )
}
