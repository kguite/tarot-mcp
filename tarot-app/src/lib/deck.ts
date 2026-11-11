import { CARDS } from '../data'
import type { Card, Spread, SpreadPosition } from '../data/types'

// Share of cards that come up reversed, the same as the server's draw_cards.
export const REVERSAL_RATE = 0.25

export type Draw = { position: SpreadPosition; card: Card; reversed: boolean }

// Where each spot is: still empty, holding a face-down card, or turned over.
export type Phase = 'empty' | 'down' | 'up'

// A reading in progress. It lives in App, so it survives switching tabs.
export type Reading = { spread: Spread; draws: Draw[]; phases: Phase[]; picked: number[]; reflection: string }

// crypto.getRandomValues, like the prototype and the server's SystemRandom. The code draws, never a model.
function randomInt(max: number) {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return value[0] % max
}

// Fisher–Yates shuffle of the whole deck, then one card per position: no card comes up twice.
export function drawSpread(spread: Spread): Draw[] {
  const deck = [...CARDS]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return spread.positions.map((position, i) => ({ position, card: deck[i], reversed: randomInt(100) < REVERSAL_RATE * 100 }))
}

export function newReading(spread: Spread): Reading {
  return { spread, draws: drawSpread(spread), phases: spread.positions.map(() => 'empty'), picked: [], reflection: '' }
}
