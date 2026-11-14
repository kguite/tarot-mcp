import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '../components/Button'
import { CardInspect } from '../components/CardInspect'
import { Eyebrow } from '../components/Eyebrow'
import { FlipCard } from '../components/FlipCard'
import { Ornament } from '../components/Ornament'
import { ReadingPanel } from '../components/ReadingPanel'
import { TextField } from '../components/TextField'
import type { Card } from '../data/types'
import { isFinished, newReading } from '../lib/deck'
import type { Reading } from '../lib/deck'
import { saveReading, updateInterpretation } from '../lib/store'
import screen from './Screen.module.css'
import styles from './Draw.module.css'

type Inspecting = { card: Card; reversed?: boolean; context: string }

// Three taps per card: tap its outline to draw it, turn it over, then tap again for its meaning.
// The reading itself lives in App (so switching tabs keeps it); only what's open on screen lives here.
export function Draw({ reading, onChange }: { reading: Reading; onChange: (reading: Reading) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const [inspecting, setInspecting] = useState<Inspecting | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth0()
  const { spread, draws, phases, reflection } = reading

  const left = phases.filter((p) => p === 'empty').length
  const turned = phases.filter((p) => p === 'up').length

  function place(slot: number) {
    onChange({ ...reading, phases: phases.map((p, i) => (i === slot ? 'down' : p)) })
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
    left > 0 ? (draws.length === 1 ? 'Tap the outline to draw your card' : `Tap an outline to draw a card · ${left} to go`)
    : turned === 0 ? 'Tap a card to turn it over'
    : open === null ? 'Look at the picture first. Tap it again for its meaning.'
    : ''
  const shown = open === null ? null : draws[open]

  return (
    <div className={`${screen.screen} ${screen.wide}`}>
      <div className={screen.title}>
        {/* A phone shows one small line, "Your reading · One card"; a wide screen the full title. */}
        <Eyebrow gold>Your reading<span className={styles.phoneOnly}> · {spread.name}</span></Eyebrow>
        <div className={styles.bigTitle}>
          <h1>{spread.name}</h1>
          <Ornament />
        </div>
      </div>

      {/* Two columns on a wide screen, stacked on a phone. Left: the cards and what they mean.
          Right: the journal (reflection and save), once every card is placed. */}
      <div
        className={[
          styles.stage,
          (left > 0 || !isAuthenticated) && styles.oneColumn,
          // No meaning open: the cards are the thing to look at, so a phone shows them big.
          open === null && styles.looking,
        ].filter(Boolean).join(' ')}
        style={{ '--cols': Math.min(draws.length, 4) } as CSSProperties}
      >
        <div className={styles.side}>
          <div className={styles.spread}>
            {draws.map((draw, i) =>
              phases[i] === 'empty' ? (
                <button key={i} className={styles.empty} onClick={() => place(i)} aria-label={`Draw a card for ${draw.position.name}`}>
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
          {hint && <p className={styles.hint}>{hint}</p>}
          {shown && (
            <div className={styles.meaning}>
              <ReadingPanel card={shown.card} reversed={shown.reversed} position={shown.position.name} question={shown.position.prompt} />
            </div>
          )}
        </div>

        <div className={styles.side}>
          {left > 0 ? null : !isAuthenticated ? (
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
