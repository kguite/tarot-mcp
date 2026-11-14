// The one boundary between the app and storage. The journal lives on the FastAPI server
// (mcp-server/main.py), so the app and Claude, through the MCP tools, share the same readings.
// Locally Vite forwards /readings to the server (vite.config.ts); hosted, Netlify forwards it to Render.
// Shaped like the future database tables (readings, reading_cards, entries).

type ReadingRow = { id: string; spread_id: string; created_at: string }
type ReadingCardRow = { reading_id: string; position: number; position_id: string; card_id: string; reversed: boolean }
type EntryRow = { id: string; reading_id: string; type: 'interpretation'; body: string; created_at: string; updated_at?: string }

// A reading joined with its cards and entries, like a database select with relations.
export type SavedReading = ReadingRow & { cards: ReadingCardRow[]; entries: EntryRow[] }

// The journal is private, so every request carries your Auth0 token. App sets this while you're
// logged in (from useAuth0) and clears it when you're not.
let getToken: (() => Promise<string | undefined>) | null = null
export function setTokenSource(source: (() => Promise<string | undefined>) | null) {
  getToken = source
}

const loggedOut = () => new Error('To record your own reflections, log in under Settings.')

async function request(path: string, init?: RequestInit) {
  if (!getToken) throw loggedOut()
  // The hint to start the server only makes sense on your own computer, not on the hosted site.
  const unreachable = new Error(import.meta.env.DEV
    ? 'The journal server is not running. Start it in mcp-server with .venv\\Scripts\\python.exe main.py'
    : 'The journal isn’t reachable right now. Try again in a minute.')
  // A token that can't be renewed (the login expired) means logging in again, not a server problem.
  const token = await getToken().catch(() => undefined)
  if (!token) throw loggedOut()
  let response: Response
  try {
    response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
  } catch {
    throw unreachable
  }
  // A forwarder answers 502, 503 or 504 when the server behind it is down or still waking up.
  if ([502, 503, 504].includes(response.status)) throw unreachable
  if (response.status === 401) throw loggedOut()
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
