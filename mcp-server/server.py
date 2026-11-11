import json
import random
from pathlib import Path
from typing import Annotated

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from pydantic import Field

# The app's data. The path is relative to this file, not to wherever the server is started.
DATA_DIR = Path(__file__).parent.parent / 'tarot-app' / 'src' / 'data'
CARDS = json.loads((DATA_DIR / 'cards.json').read_text(encoding='utf-8'))
SPREADS = json.loads((DATA_DIR / 'spreads.json').read_text(encoding='utf-8'))

# Share of cards that come up reversed, matching the prototype.
REVERSAL_RATE = 0.25

# SystemRandom draws from the OS, like crypto.getRandomValues in the prototype.
rng = random.SystemRandom()

mcp = MCPServer(name='tarot')


# The docstring and the Field description are the "menu" Claude reads.
# The function body is the "kitchen": Claude never sees it, only what it returns.
# structured_output=False: with "-> str" the SDK otherwise sends the result twice (content and structuredContent).
@mcp.tool(structured_output=False)
def get_card(
    id: Annotated[str, Field(description="The card's id, lowercase with hyphens, like 'moon' or 'seven-of-wands'")],
) -> str:
    """Look up one tarot card by id and return its data: name, keywords upright and reversed, themes, and a reflection prompt."""
    for card in CARDS:
        if card['id'] == id:
            return json.dumps(card, indent=2)
    ids = ', '.join(c['id'] for c in CARDS)
    raise ToolError(f"No card with id '{id}'. Valid ids: {ids}")


@mcp.tool(structured_output=False)
def list_spreads() -> str:
    """List the tarot spreads: id, name, a one-line summary, and the positions in order."""
    return json.dumps([
        {'id': s['id'], 'name': s['name'], 'summary': s['summary'], 'positions': [p['name'] for p in s['positions']]}
        for s in SPREADS
    ], indent=2)


# The code draws the cards, never the model: Claude asks for a draw and reads what came up.
@mcp.tool(structured_output=False)
def draw_cards(
    spread_id: Annotated[str, Field(description="The spread's id from list_spreads, like 'past-present-future'")],
) -> str:
    """Shuffle and draw one card for each position in a spread. Returns each position with its question, the card, whether it is reversed, and the keywords for that orientation."""
    spread = next((s for s in SPREADS if s['id'] == spread_id), None)
    if spread is None:
        ids = ', '.join(s['id'] for s in SPREADS)
        raise ToolError(f"No spread with id '{spread_id}'. Valid ids: {ids}")

    positions = spread['positions']
    # sample deals from the deck: no card comes up twice.
    cards = rng.sample(CARDS, len(positions))

    draws = []
    for position, card in zip(positions, cards):
        reversed_ = rng.random() < REVERSAL_RATE
        draws.append({
            'position': position['name'],
            'question': position['prompt'],
            'card_id': card['id'],
            'card': card['name'],
            'reversed': reversed_,
            'keywords': card['keywords']['reversed' if reversed_ else 'upright'],
        })
    return json.dumps(draws, indent=2)


# A prompt is a set menu the person picks. It can do what a tool can't: tell Claude to wait.
@mcp.prompt()
def daily_draw(
    question: Annotated[str, Field(description='What you are asking today. Leave blank for an open draw.')] = '',
) -> str:
    """A one-card daily draw: your first impression comes before any meaning."""
    asking = f'My question today: {question}' if question else 'I have no question today, just an open draw.'
    return f"""Let's do a daily one-card draw. {asking}

1. Call draw_cards with spread_id 'single'.
2. Tell me only the card's name and whether it is reversed. Then ask what I notice first, before any meaning.
3. Wait for my answer. Don't share keywords or meanings until I have written my first impression.
4. Then talk about the card, starting from what I wrote. Ask questions; don't predict what will happen."""


if __name__ == '__main__':
    # stdio: stdout is the channel to the client, so never print() here.
    mcp.run()
