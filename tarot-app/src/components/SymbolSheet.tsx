import { artUrl } from '../data'
import type { Card, CardSymbol } from '../data/types'
import { Eyebrow } from './Eyebrow'
import { IconButton } from './Button'
import styles from './SymbolSheet.module.css'

type SymbolSheetProps = {
  symbol: CardSymbol
  alsoIn: Card[]
  onPick: (card: Card) => void
  onClose: () => void
}

// Slides up over the inspect view: what a symbol means, and the other cards it appears on.
export function SymbolSheet({ symbol, alsoIn, onPick, onClose }: SymbolSheetProps) {
  return (
    <section className={styles.sheet} aria-label={`Symbol: ${symbol.name}`}>
      <div className={styles.top}>
        <Eyebrow gold>Symbol</Eyebrow>
        <IconButton label="Close symbol" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </IconButton>
      </div>
      <h2 className={styles.name}>{symbol.name}</h2>
      <p className={styles.summary}>{symbol.summary}</p>
      {alsoIn.length > 0 && (
        <>
          <div className={styles.rule}>
            <Eyebrow gold>Also in</Eyebrow>
          </div>
          <div className={styles.cards}>
            {alsoIn.map((card) => (
              <button key={card.id} className={styles.thumb} onClick={() => onPick(card)}>
                <span className={styles.frame}>
                  <img src={artUrl(card.id)} alt="" />
                </span>
                <span className={styles.thumbName}>{card.name}</span>
              </button>
            ))}
          </div>
          <p className={styles.across}>{symbol.across}</p>
        </>
      )}
    </section>
  )
}
