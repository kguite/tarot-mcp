import { useState, type ReactNode } from 'react'
import { Card } from '../components/Card'
import { CardInspect } from '../components/CardInspect'
import { Eyebrow } from '../components/Eyebrow'
import { CupIcon, PentacleIcon, SwordIcon, WandIcon } from '../components/icons'
import { Star } from '../components/Star'
import { ARCANA, CARDS, SUITS } from '../data'
import type { Card as CardData, SuitId } from '../data/types'
import screen from './Screen.module.css'
import styles from './Learn.module.css'

type Group = 'major' | SuitId

const ICONS: Record<Group, ReactNode> = {
  major: <Star size={22} />,
  wands: <WandIcon />,
  cups: <CupIcon />,
  swords: <SwordIcon />,
  pentacles: <PentacleIcon />,
}

const major = ARCANA.find((a) => a.id === 'major')!
const GROUPS = [
  { id: 'major' as Group, name: 'Majors', title: major.name, eyebrow: '22 cards', summary: major.summary, prompt: undefined },
  ...SUITS.map((s) => ({ id: s.id as Group, name: s.name, title: s.name, eyebrow: s.element, summary: s.summary, prompt: s.prompt })),
]

const inGroup = (card: CardData, group: Group | null) =>
  group === null || (group === 'major' ? card.arcana === 'major' : card.arcana === 'minor' && card.suit === group)

// All 78 cards to browse, or one group with what it means above it. Tap a card to look closer.
export function Learn() {
  const [group, setGroup] = useState<Group | null>(null)
  const [inspecting, setInspecting] = useState<CardData | null>(null)
  const shown = GROUPS.find((g) => g.id === group)
  return (
    <div className={`${screen.screen} ${screen.wide}`}>
      <div className={screen.title}>
        <Eyebrow gold>Learn</Eyebrow>
        <h1>The cards</h1>
      </div>
      <div className={styles.filters} role="group" aria-label="Show">
        <button className={styles.filter} aria-pressed={group === null} onClick={() => setGroup(null)}>
          All
        </button>
        {GROUPS.map((g) => (
          <button key={g.id} className={styles.filter} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
            {ICONS[g.id]}
            <span>{g.name}</span>
          </button>
        ))}
      </div>
      {shown && (
        <section className={styles.about} aria-live="polite">
          <Eyebrow gold>{shown.eyebrow}</Eyebrow>
          <h2>{shown.title}</h2>
          <p className={styles.summary}>{shown.summary}</p>
          {shown.prompt && <p className={styles.prompt}>{shown.prompt}</p>}
        </section>
      )}
      <div className={styles.grid}>
        {CARDS.filter((card) => inGroup(card, group)).map((card) => (
          <Card key={card.id} state="resting" label={card.name} card={card} onOpen={() => setInspecting(card)} />
        ))}
      </div>
      {inspecting && (
        <CardInspect
          key={inspecting.id}
          card={inspecting}
          context={inspecting.arcana === 'major' ? 'Major Arcana' : inspecting.suit}
          onClose={() => setInspecting(null)}
          onOpen={setInspecting}
        />
      )}
    </div>
  )
}
