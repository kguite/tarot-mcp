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

// Something that appears in card pictures, like pillars or a dog. Cards point to these by id.
export interface CardSymbol {
  id: string
  name: string
  summary: string
  // How the symbol shows up across its cards, for the "Also in" sheet. Placeholder text for now.
  across: string
}

// Something to tap on the card art. region is a rough x and y on the card, 0 to 100.
// symbols are the ids this spot shows (the dog and the wolf is two).
export interface CardDetail {
  id: string
  label: string
  prompt: string
  symbols: string[]
  region: { x: number; y: number }
}

// away: the figure's back is to you (Three of Wands, Eight of Cups).
export type Facing = 'left' | 'right' | 'forward' | 'away'
export type Pose =
  | 'standing' | 'seated' | 'walking' | 'riding' | 'kneeling'
  | 'lying' | 'falling' | 'upside-down' | 'dancing' | 'flying'

// Most written fields are placeholders ("<name> placeholder summary.") until the wording is done.
interface CardBase {
  id: string
  name: string
  keywords: Keywords
  themes: string[]
  prompt: string
  summary: string
  meaning: { upright: string; reversed: string }
  advice: string
  affirmation: string
  as_a_person: string | null
  // Which way the main figure looks, from the viewer's side, read off the 1909 art.
  // null when there is no figure or no single main one.
  facing: Facing | null
  // What that figure's body is doing. Several figures sharing one pose count (the Tower's two falling).
  pose: Pose | null
  // Everything in the picture, as symbol ids. details are the tappable few.
  symbols: string[]
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
  // The Major with the same number. Court ranks (11 to 14) have none.
  major?: CardRef & { number: number }
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
