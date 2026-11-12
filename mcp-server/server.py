import json
import random
from datetime import date
from pathlib import Path
from typing import Annotated, Literal

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ResourceNotFoundError, ToolError
from pydantic import BaseModel, Field

import journal

# The app's data. The path is relative to this file, not to wherever the server is started.
DATA_DIR = Path(__file__).parent.parent / 'tarot-app' / 'src' / 'data'


def load(name):
    return json.loads((DATA_DIR / f'{name}.json').read_text(encoding='utf-8'))


def by_id(items, id):
    """The item with this id, or None."""
    return next((item for item in items if item['id'] == id), None)


CARDS = load('cards')
SPREADS = load('spreads')
WAITE = load('waite')
SYMBOLS = load('symbols')

# Share of cards that come up reversed, matching the prototype.
REVERSAL_RATE = 0.25

# SystemRandom draws from the OS, like crypto.getRandomValues in the prototype.
rng = random.SystemRandom()

Suit = Literal['wands', 'cups', 'swords', 'pentacles']
# Read off the 1909 art for the main figure. Kept in step with Facing and Pose in types.ts.
Facing = Literal['left', 'right', 'forward', 'away']
Pose = Literal['standing', 'seated', 'walking', 'riding', 'kneeling', 'lying', 'falling', 'upside-down', 'dancing', 'flying']

# Sent to the client when it connects. Claude's system prompt isn't ours, so the app's one rule
# has to travel with the server.
mcp = MCPServer(
    name='tarot',
    instructions=(
        'Tarot here is for reflection, not fortune telling. A reading is a turn at the cards, not an answer. '
        "Talk about the cards and what the user wrote, ask questions, and never predict what will happen."
    ),
)


# The docstring and the Field description are the "menu" Claude reads.
# The function body is the "kitchen": Claude never sees it, only what it returns.
# structured_output=False: with "-> str" the SDK otherwise sends the result twice (content and structuredContent).
@mcp.tool(structured_output=False)
def get_card(
    id: Annotated[str, Field(description="The card's id, lowercase with hyphens, like 'moon' or 'seven-of-wands'")],
) -> str:
    """Look up one tarot card by id and return all its data: name, arcana, number or suit and rank, keywords upright and reversed, themes, reflection prompt, summary, meaning, advice, affirmation, as a person, the main figure's facing and pose, the symbols in the picture, and tappable details."""
    card = by_id(CARDS, id)
    if card is None:
        raise ToolError(f"No card with id '{id}'. Valid ids: {', '.join(c['id'] for c in CARDS)}")
    return json.dumps(card, indent=2)


# The filtering happens here, not in the model: Claude gets the matching cards, not all of them to scan.
@mcp.tool(structured_output=False)
def find_cards(
    symbol: Annotated[str | None, Field(description="A symbol id from the card pictures, like 'pillars', 'dog' or 'water'")] = None,
    suit: Annotated[Suit | None, Field(description='A Minor suit')] = None,
    rank: Annotated[int | None, Field(description='A Minor card rank: 1 Ace to 10, then 11 Page, 12 Knight, 13 Queen, 14 King. Majors have no rank.', ge=1, le=14)] = None,
    facing: Annotated[Facing | None, Field(description="Where the main figure looks, from the viewer's side. away: the figure's back is turned")] = None,
    pose: Annotated[Pose | None, Field(description="What the main figure's body is doing")] = None,
) -> str:
    """Find cards by what is in the picture, by suit, by number, or by the main figure's facing and pose. Filters combine. Returns each matching card's id and name, and the symbol's summary and across line when filtering by symbol."""
    if all(v is None for v in (symbol, suit, rank, facing, pose)):
        raise ToolError('Give at least one of symbol, suit, rank, facing or pose.')
    found = {}
    if symbol is not None:
        found['symbol'] = by_id(SYMBOLS, symbol)
        if found['symbol'] is None:
            raise ToolError(f"No symbol '{symbol}'. Valid symbols: {', '.join(s['id'] for s in SYMBOLS)}")

    found['cards'] = [
        {'id': c['id'], 'name': c['name']}
        for c in CARDS
        if (symbol is None or symbol in c['symbols'])
        and (suit is None or c.get('suit') == suit)
        and (rank is None or c.get('rank') == rank)
        and (facing is None or c['facing'] == facing)
        and (pose is None or c['pose'] == pose)
    ]
    return json.dumps(found, indent=2)


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
    spread = by_id(SPREADS, spread_id)
    if spread is None:
        raise ToolError(f"No spread with id '{spread_id}'. Valid ids: {', '.join(s['id'] for s in SPREADS)}")

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


class DrawnCard(BaseModel):
    card_id: str = Field(description="The card's id, like 'moon'")
    reversed: bool = False


@mcp.tool(structured_output=False)
def get_readings(
    card_id: Annotated[str | None, Field(description="Only readings with this card, like 'moon'")] = None,
    spread_id: Annotated[str | None, Field(description="Only readings with this spread, like 'single'")] = None,
    since: Annotated[date | None, Field(description='Only readings on or after this day (UTC)')] = None,
    until: Annotated[date | None, Field(description='Only readings on or before this day (UTC)')] = None,
) -> str:
    """The user's saved readings from their journal, newest first: when, the spread, each card with its position and whether it was reversed, and the reflection the user wrote. A reading is a turn at the cards, not an answer; the reflections are the user's own words. Filters combine."""
    if card_id is not None and by_id(CARDS, card_id) is None:
        raise ToolError(f"No card with id '{card_id}'. Valid ids: {', '.join(c['id'] for c in CARDS)}")
    if spread_id is not None and by_id(SPREADS, spread_id) is None:
        raise ToolError(f"No spread with id '{spread_id}'. Valid ids: {', '.join(s['id'] for s in SPREADS)}")

    readings = [
        r for r in journal.all_readings()
        if (card_id is None or any(c['card_id'] == card_id for c in r['cards']))
        and (spread_id is None or r['spread_id'] == spread_id)
        and (since is None or r['created_at'][:10] >= since.isoformat())
        and (until is None or r['created_at'][:10] <= until.isoformat())
    ]
    # Names alongside the ids, so Claude can talk about a reading without a get_card call per card.
    for r in readings:
        positions = by_id(SPREADS, r['spread_id'])['positions']
        for c in r['cards']:
            c['position_name'] = positions[c['position']]['name']
            c['card'] = by_id(CARDS, c['card_id'])['name']
    return json.dumps(readings, indent=2)


@mcp.tool(structured_output=False)
def save_reading(
    spread_id: Annotated[str, Field(description="The spread's id from list_spreads, like 'single'")],
    cards: Annotated[list[DrawnCard], Field(description="One card per position, in the spread's order")],
    reflection: Annotated[str, Field(description="The user's reflection, in their own words. Empty if they wrote none.")] = '',
) -> str:
    """Save a reading to the user's journal, where the app shows it too. For cards the user drew anywhere: in the app, with draw_cards, or from a physical deck. Returns the new reading's id."""
    spread = by_id(SPREADS, spread_id)
    if spread is None:
        raise ToolError(f"No spread with id '{spread_id}'. Valid ids: {', '.join(s['id'] for s in SPREADS)}")
    positions = spread['positions']
    if len(cards) != len(positions):
        raise ToolError(f"'{spread_id}' has {len(positions)} positions ({', '.join(p['name'] for p in positions)}), so it needs {len(positions)} cards, not {len(cards)}.")
    unknown = [c.card_id for c in cards if by_id(CARDS, c.card_id) is None]
    if unknown:
        raise ToolError(f"No card with id {', '.join(repr(u) for u in unknown)}. Valid ids: {', '.join(c['id'] for c in CARDS)}")

    id = journal.add_reading(spread_id, [(p['id'], c.card_id, c.reversed) for p, c in zip(positions, cards)], reflection)
    return json.dumps({'id': id})


# A resource is reading material the person (or app) attaches. Claude reads it; nothing runs.
# {id} makes this a template: one resource per card, read by URI like tarot://waite/moon.
@mcp.resource('tarot://waite/{id}', mime_type='text/plain')
def waite(id: str) -> str:
    """A.E. Waite's own words on one card, from The Pictorial Key to the Tarot (1911): what the picture shows, then the upright and reversed meanings."""
    card = by_id(WAITE['cards'], id)
    if card is None:
        # Unlike a tool error, this goes to the app as a protocol error, not to Claude.
        raise ResourceNotFoundError(f"No Waite text for '{id}'")
    source = WAITE['source']
    reversed_ = f"Reversed: {card['reversed']}\n\n" if card['reversed'] else ''  # none for the Two of Cups
    return (
        f"{card['description']}\n\n"
        f"Upright: {card['upright']}\n\n"
        f"{reversed_}"
        f"Source: {source['author']}, {source['title']} ({source['edition']}), via {source['from']}. "
        f"{source['urls']['minors_and_meanings']}"
    )


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
