import json
from pathlib import Path
from typing import Annotated

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from pydantic import Field

# The app's card data. The path is relative to this file, not to wherever the server is started.
CARDS_PATH = Path(__file__).parent.parent / 'tarot-app' / 'src' / 'data' / 'cards.json'
CARDS = json.loads(CARDS_PATH.read_text(encoding='utf-8'))

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


if __name__ == '__main__':
    # stdio: stdout is the channel to the client, so never print() here.
    mcp.run()
