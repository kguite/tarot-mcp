import { readFileSync } from 'node:fs'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// Only the fields this server uses. The full card type lives in tarot-app/src/data/types.ts.
interface Card {
  id: string
  name: string
}

// Read the app's card data. The path is relative to this file, not to wherever the server is started from.
const cardsPath = new URL('../../tarot-app/src/data/cards.json', import.meta.url)
const cards: Card[] = JSON.parse(readFileSync(cardsPath, 'utf8'))

const server = new McpServer({ name: 'tarot', version: '0.1.0' })

// The name, description and input schema are the "menu" Claude reads.
// The function is the "kitchen": Claude never sees it, only what it returns.
server.registerTool(
  'get_card',
  {
    title: 'Get a tarot card',
    description: 'Look up one tarot card by id and return its data: name, keywords upright and reversed, themes, and a reflection prompt.',
    inputSchema: {
      id: z.string().describe("The card's id, lowercase with hyphens, like 'moon' or 'seven-of-wands'"),
    },
  },
  async ({ id }) => {
    const card = cards.find(c => c.id === id)
    if (!card) {
      const ids = cards.map(c => c.id).join(', ')
      return {
        isError: true,
        content: [{ type: 'text', text: `No card with id '${id}'. Valid ids: ${ids}` }],
      }
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(card, null, 2) }],
    }
  },
)

// stdout is the channel to the client, so log to stderr only. console.log would corrupt the messages.
await server.connect(new StdioServerTransport())
console.error('Tarot MCP server running on stdio')
