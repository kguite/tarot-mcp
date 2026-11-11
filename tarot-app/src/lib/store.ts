// The one boundary between the app and storage, ported from the prototype.
// Shaped like the future database tables (readings, reading_cards, entries). Everything else only calls
// these async functions, so moving to the FastAPI backend means rewriting this file alone.

const KEY = 'tarot-app-v1'

type ReadingRow = { id: string; spread_id: string; created_at: string }
type ReadingCardRow = { reading_id: string; position: number; position_id: string; card_id: string; reversed: boolean }
type EntryRow = { id: string; reading_id: string; type: 'interpretation'; body: string; created_at: string; updated_at?: string }
type Db = { readings: ReadingRow[]; reading_cards: ReadingCardRow[]; entries: EntryRow[] }

// A reading joined with its cards and entries, like a database select with relations.
export type SavedReading = ReadingRow & { cards: ReadingCardRow[]; entries: EntryRow[] }

const emptyDb = (): Db => ({ readings: [], reading_cards: [], entries: [] })

// localStorage can be missing or full (private browsing, storage limits), so reads fall back and writes report.
function load(): Db {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? emptyDb()
  } catch {
    return emptyDb()
  }
}

function persist(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    throw new Error('Storage is full or unavailable.')
  }
}

function withRelations(db: Db, reading: ReadingRow): SavedReading {
  return {
    ...reading,
    cards: db.reading_cards.filter((c) => c.reading_id === reading.id).sort((a, b) => a.position - b.position),
    entries: db.entries.filter((e) => e.reading_id === reading.id).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

export async function saveReading(spreadId: string, cards: { positionId: string; cardId: string; reversed: boolean }[], body: string) {
  const db = load()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.readings.push({ id, spread_id: spreadId, created_at: now })
  cards.forEach((c, i) => db.reading_cards.push({ reading_id: id, position: i, position_id: c.positionId, card_id: c.cardId, reversed: c.reversed }))
  if (body) db.entries.push({ id: crypto.randomUUID(), reading_id: id, type: 'interpretation', body, created_at: now })
  persist(db)
  return id
}

export async function updateInterpretation(readingId: string, body: string) {
  const db = load()
  const now = new Date().toISOString()
  const entry = db.entries.find((e) => e.reading_id === readingId && e.type === 'interpretation')
  if (entry) {
    entry.body = body
    entry.updated_at = now
  } else {
    db.entries.push({ id: crypto.randomUUID(), reading_id: readingId, type: 'interpretation', body, created_at: now })
  }
  persist(db)
}

export async function listReadings() {
  const db = load()
  return db.readings
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => withRelations(db, r))
}
