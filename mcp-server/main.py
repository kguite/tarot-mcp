import os
from contextlib import asynccontextmanager
from datetime import date
from urllib.parse import urlparse

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Response
from mcp.server.mcpserver.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import BaseModel

import journal
from server import DrawnCard, Facing, Pose, Suit, draw_cards, find_cards, get_card, get_readings, list_spreads, mcp, save_reading

# This server's public address. MCP only accepts requests addressed to this host.
# On Render it's the service's own URL, which Render sets as RENDER_EXTERNAL_URL.
# Port 8001 locally, since the work API (lb_database_api) already runs on uvicorn's default 8000.
MCP_SERVER_URL = urlparse(os.getenv('MCP_SERVER_URL') or os.getenv('RENDER_EXTERNAL_URL', 'http://127.0.0.1:8001') + '/mcp')


@asynccontextmanager
async def lifespan(app: FastAPI):
    # The MCP server needs a background task running while the app is up.
    async with mcp.session_manager.run():
        yield


app = FastAPI(title='Tarot', lifespan=lifespan)


def json_reply(call, error_status: int) -> Response:
    # The tools already return JSON text, so send it as-is; returning the string would encode it twice.
    try:
        return Response(call(), media_type='application/json')
    except ToolError as error:
        raise HTTPException(status_code=error_status, detail=str(error))


# REST and MCP call the same functions, so the app and Claude always get the same answer.
@app.get('/cards/{card_id}')
def read_card(card_id: str):
    return json_reply(lambda: get_card(card_id), 404)


@app.get('/cards')
def search_cards(
    symbol: str | None = None,
    suit: Suit | None = None,
    rank: int | None = Query(None, ge=1, le=14),
    facing: Facing | None = None,
    pose: Pose | None = None,
):
    return json_reply(lambda: find_cards(symbol, suit, rank, facing, pose), 400)


@app.get('/spreads')
def read_spreads():
    return Response(list_spreads(), media_type='application/json')


# POST, not GET: every call is a new random draw, so it must never be cached or repeated by a browser.
@app.post('/spreads/{spread_id}/draw')
def draw(spread_id: str):
    return json_reply(lambda: draw_cards(spread_id), 404)


class NewReading(BaseModel):
    spread_id: str
    cards: list[DrawnCard]
    reflection: str = ''


class Reflection(BaseModel):
    body: str


# The journal. The app saves here and Claude saves through save_reading: one journal, two doors.
@app.get('/readings')
def read_readings(card_id: str | None = None, spread_id: str | None = None, since: date | None = None, until: date | None = None):
    return json_reply(lambda: get_readings(card_id, spread_id, since, until), 400)


@app.post('/readings')
def create_reading(reading: NewReading):
    return json_reply(lambda: save_reading(reading.spread_id, reading.cards, reading.reflection), 400)


@app.put('/readings/{reading_id}/reflection')
def edit_reflection(reading_id: str, reflection: Reflection):
    if not journal.set_reflection(reading_id, reflection.body):
        raise HTTPException(status_code=404, detail=f"No reading with id '{reading_id}'")


# MCP at /mcp. Mounted last so the routes above take priority.
# Stateless with plain JSON replies, like speak_friend: simplest, and safe with several copies running.
app.mount('/', mcp.streamable_http_app(
    streamable_http_path='/mcp',
    stateless_http=True,
    json_response=True,
    transport_security=TransportSecuritySettings(
        allowed_hosts=[MCP_SERVER_URL.netloc],
        allowed_origins=[f'{MCP_SERVER_URL.scheme}://{MCP_SERVER_URL.netloc}'],
    ),
))


if __name__ == '__main__':
    uvicorn.run(app='main:app', port=MCP_SERVER_URL.port, reload=True)
