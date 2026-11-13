from contextlib import asynccontextmanager
from datetime import date
from typing import Annotated

import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from mcp.server.mcpserver.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import BaseModel

import auth
import journal
from server import DrawnCard, Facing, Pose, Suit, draw_cards, find_cards, get_card, list_spreads, mcp, readings_for, save_for

MCP_SERVER_URL = auth.MCP_SERVER_URL


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


def logged_in_user(authorization: Annotated[str | None, Header()] = None) -> str:
    """The Auth0 user id from the request's "Authorization: Bearer <token>" header, or a 401."""
    denied = HTTPException(status_code=401, detail='Log in to use your journal.', headers={'WWW-Authenticate': 'Bearer'})
    if not authorization or not authorization.startswith('Bearer '):
        raise denied
    try:
        return auth.verify(authorization.removeprefix('Bearer '))['sub']
    except auth.AccessDenied:
        raise denied


User = Annotated[str, Depends(logged_in_user)]


# REST and MCP call the same functions, so the app and Claude always get the same answer.
# The cards and spreads are public; only the journal needs a login.
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
# Each person sees and changes only their own readings.
@app.get('/readings')
def read_readings(user: User, card_id: str | None = None, spread_id: str | None = None, since: date | None = None, until: date | None = None):
    return json_reply(lambda: readings_for(user, card_id, spread_id, since, until), 400)


@app.post('/readings')
def create_reading(user: User, reading: NewReading):
    return json_reply(lambda: save_for(user, reading.spread_id, reading.cards, reading.reflection), 400)


@app.put('/readings/{reading_id}/reflection')
def edit_reflection(user: User, reading_id: str, reflection: Reflection):
    if not journal.set_reflection(user, reading_id, reflection.body):
        raise HTTPException(status_code=404, detail=f"No reading with id '{reading_id}'")


# MCP at /mcp, which needs a login (server.py). Mounted last so the routes above take priority.
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
