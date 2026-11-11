import { useState } from 'react'
import { Card } from '../components/Card'
import { CardInspect } from '../components/CardInspect'
import { Eyebrow } from '../components/Eyebrow'
import { CARDS } from '../data'
import type { Card as CardData } from '../data/types'
import screen from './Screen.module.css'
import styles from './Learn.module.css'

// All 78 cards to browse; tap one to look closer. Tabs and filters (suit, symbol, facing, pose) come later.
export function Learn() {
  const [inspecting, setInspecting] = useState<CardData | null>(null)
  return (
    <div className={`${screen.screen} ${screen.wide}`}>
      <div className={screen.title}>
        <Eyebrow gold>Learn</Eyebrow>
        <h1>The cards</h1>
      </div>
      <div className={styles.grid}>
        {CARDS.map((card) => (
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
