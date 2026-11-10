export type Arcana = 'major' | 'minor'
export type SuitId = 'wands' | 'cups' | 'swords' | 'pentacles'
export type Element = 'fire' | 'water' | 'air' | 'earth'

// A pointer to another card, for links like "echoes The Magician"
export interface CardRef {
  id: string
  name: string
}

export interface Keywords {
  upright: string[]
  reversed: string[]
}

// Something to tap on the card art. region is a rough x and y on the card, 0 to 100.
export interface CardDetail {
  id: string
  label: string
  prompt: string
  region: { x: number; y: number }
}

interface CardBase {
  id: string
  name: string
  keywords: Keywords
  themes: string[]
  prompt: string
  details: CardDetail[]
}

export interface MajorCard extends CardBase {
  arcana: 'major'
  number: number
}

export interface MinorCard extends CardBase {
  arcana: 'minor'
  suit: SuitId
  rank: number
  combined: string
}

// Checking card.arcana tells TypeScript which kind it is, so card.suit is only allowed on a Minor
export type Card = MajorCard | MinorCard

export interface Suit {
  id: SuitId
  name: string
  element: Element
  playing_card: string
  summary: string
  prompt: string
}

export interface Rank {
  rank: number
  name: string
  plural: string
  summary: string
  prompt: string
  major: CardRef & { number: number }
}

export interface JourneyRow {
  row: number
  cards: string
  summary: string
  prompt: string
  members: CardRef[]
}

export interface ArcanaInfo {
  id: Arcana
  name: string
  count: number
  summary: string
}

export interface SpreadPosition {
  id: string
  name: string
  prompt: string
}

export interface Spread {
  id: string
  name: string
  summary: string
  level: number
  positions: SpreadPosition[]
}
