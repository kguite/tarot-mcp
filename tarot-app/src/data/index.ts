import arcanaJson from './arcana.json'
import cardsJson from './cards.json'
import journeyJson from './journey.json'
import ranksJson from './ranks.json'
import spreadsJson from './spreads.json'
import suitsJson from './suits.json'
import symbolsJson from './symbols.json'
import type { ArcanaInfo, Card, CardSymbol, JourneyRow, Rank, Spread, Suit } from './types'

// TypeScript reads "major" in JSON as any string, not the 'major' | 'minor' union,
// so each list is cast to its type here, once, and the rest of the app imports from this file.
export const ARCANA = arcanaJson as ArcanaInfo[]
export const CARDS = cardsJson as Card[]
export const JOURNEY = journeyJson as JourneyRow[]
export const RANKS = ranksJson as Rank[]
export const SPREADS = spreadsJson as Spread[]
export const SUITS = suitsJson as Suit[]
export const SYMBOLS = symbolsJson as CardSymbol[]

// Each card's 1909 art, in public/cards (credits in public/cards/CREDITS.md).
export const artUrl = (id: string) => `${import.meta.env.BASE_URL}cards/${id}.webp`
