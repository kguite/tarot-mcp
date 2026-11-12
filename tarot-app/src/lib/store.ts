// The one boundary between the app and storage. The journal lives on the FastAPI server
// (mcp-server/main.py), so the app and Claude, through the MCP tools, share the same readings.
// Vite forwards /readings to the server (vite.config.ts), so start it with .venv\Scripts\python.exe main.py.
// Shaped like the future database tables (readings, reading_cards, entries).

type ReadingRow = { id: string; spread_id: string; created_at: string }
type ReadingCardRow = { reading_id: string; position: number; position_id: string; card_id: string; reversed: boolean }
type EntryRow = { id: string; reading_id: string; type: 'interpretation'; body: string; created_at: string; updated_at?: string }

// A reading joined with its cards and entries, like a database select with relations.
export type SavedReading = ReadingRow & { cards: ReadingCardRow[]; entries: EntryRow[] }

async function request(path: string, init?: RequestInit) {
  const notRunning = new Error('The journal server is not running. Start it in mcp-server with .venv\\Scripts\\python.exe main.py')
  let response: Response
  try {
    response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json' } })
  } catch {
    throw notRunning
  }
  // Vite's forwarding answers 502 when nothing is listening on the server's port.
  if (response.status === 502) throw notRunning
  if (!response.ok) throw new Error(`The journal server answered ${response.status}.`)
  return response.json()
}

// Cards in the spread's position order; the server matches them to the positions.
export async function saveReading(spreadId: string, cards: { cardId: string; reversed: boolean }[], body: string) {
  const saved = await request('/readings', {
    method: 'POST',
    body: JSON.stringify({ spread_id: spreadId, cards: cards.map((c) => ({ card_id: c.cardId, reversed: c.reversed })), reflection: body }),
  })
  return saved.id as string
}

export async function updateInterpretation(readingId: string, body: string) {
  await request(`/readings/${readingId}/reflection`, { method: 'PUT', body: JSON.stringify({ body }) })
}

// Every reading, newest first, or only those with one card (filtered on the server, like get_readings).
export async function listReadings(cardId?: string): Promise<SavedReading[]> {
  return request(cardId ? `/readings?card_id=${encodeURIComponent(cardId)}` : '/readings')
}
