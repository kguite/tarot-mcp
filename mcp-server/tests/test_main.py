import json

import pytest
from fastapi.testclient import TestClient

import auth
from main import app

MCP_HEADERS = {'Accept': 'application/json, text/event-stream', 'Content-Type': 'application/json'}


# "with" runs the app's startup, which MCP needs. The base URL matches the host MCP accepts.
@pytest.fixture(scope='module')
def client():
    with TestClient(app, base_url='http://127.0.0.1:8001') as c:
        yield c


def test_rest_card(client):
    assert client.get('/cards/moon').json()['name'] == 'The Moon'


# A tool's error becomes an HTTP status, with the same helpful message Claude gets.
def test_rest_unknown_card_is_404(client):
    response = client.get('/cards/the-moon')

    assert response.status_code == 404
    assert 'Valid ids' in response.json()['detail']


def test_rest_search_shares_find_cards(client):
    found = client.get('/cards', params={'symbol': 'pillars'}).json()

    assert [c['id'] for c in found['cards']] == ['high-priestess', 'hierophant', 'justice', 'death']


# FastAPI checks the allowed suits before any of our code runs.
def test_rest_bad_suit_is_422(client):
    assert client.get('/cards', params={'suit': 'hearts'}).status_code == 422


def test_rest_draw(client):
    response = client.post('/spreads/past-present-future/draw')

    assert [d['position'] for d in response.json()] == ['Past', 'Present', 'Future']


INITIALIZE = {
    'jsonrpc': '2.0', 'id': 1, 'method': 'initialize',
    'params': {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'test', 'version': '0'}},
}
MOON = {'spread_id': 'single', 'cards': [{'card_id': 'moon'}], 'reflection': 'First try.'}


# The same server answers MCP at /mcp: the first message of the handshake, over HTTP, logged in.
# The no-predictions rule rides along in the handshake, since Claude's system prompt isn't ours.
def test_mcp_over_http(client, login):
    response = client.post('/mcp', headers=MCP_HEADERS | login('alice'), json=INITIALIZE)

    assert response.status_code == 200
    assert response.json()['result']['serverInfo']['name'] == 'tarot'
    assert 'never predict' in response.json()['result']['instructions']


# Without a token, /mcp says no and points the client at where to find out how to log in.
def test_mcp_needs_a_login(client):
    response = client.post('/mcp', headers=MCP_HEADERS, json=INITIALIZE)

    assert response.status_code == 401
    assert 'oauth-protected-resource' in response.headers['WWW-Authenticate']


# That pointer leads to the Auth0 tenant: this is how Claude learns where to send you to log in.
def test_mcp_names_the_auth0_tenant(client):
    metadata = client.get('/.well-known/oauth-protected-resource/mcp').json()

    assert metadata['authorization_servers'] == [auth.AUTH0_ISSUER]


# The app's door: save, list, then edit the reflection.
def test_rest_journal_round_trip(client, empty_journal, login):
    saved = client.post('/readings', headers=login('alice'), json=MOON).json()

    assert client.put(f"/readings/{saved['id']}/reflection", headers=login('alice'), json={'body': 'Second try.'}).status_code == 200
    reading = client.get('/readings', headers=login('alice')).json()[0]
    assert reading['id'] == saved['id']
    assert reading['entries'][0]['body'] == 'Second try.'


def test_rest_edit_unknown_reading_is_404(client, empty_journal, login):
    assert client.put('/readings/nope/reflection', headers=login('alice'), json={'body': 'x'}).status_code == 404


# The journal is private: no token, a forged one, or one for another API all get a 401.
def test_rest_journal_needs_a_valid_token(client, empty_journal, login):
    forged = {'Authorization': 'Bearer not-a-token'}
    other_api = login('alice', audience='https://some-other-api.example.com')

    for headers in ({}, forged, other_api):
        assert client.get('/readings', headers=headers).status_code == 401
        assert client.post('/readings', headers=headers, json=MOON).status_code == 401


# Each person sees only their own readings, and can't change someone else's.
def test_rest_journals_are_separate(client, empty_journal, login):
    alices = client.post('/readings', headers=login('alice'), json=MOON).json()
    client.post('/readings', headers=login('bob'), json=MOON | {'reflection': 'Bob was here.'})

    assert [r['id'] for r in client.get('/readings', headers=login('alice')).json()] == [alices['id']]
    assert client.put(f"/readings/{alices['id']}/reflection", headers=login('bob'), json={'body': 'Hacked.'}).status_code == 404
    assert client.get('/readings', headers=login('alice')).json()[0]['entries'][0]['body'] == 'First try.'


# Claude's door sees the same per-person journal: get_readings over /mcp returns the caller's readings.
def test_mcp_get_readings_is_the_callers_journal(client, empty_journal, login):
    alices = client.post('/readings', headers=login('alice'), json=MOON).json()
    client.post('/readings', headers=login('bob'), json=MOON)

    response = client.post('/mcp', headers=MCP_HEADERS | login('alice'), json={
        'jsonrpc': '2.0', 'id': 2, 'method': 'tools/call', 'params': {'name': 'get_readings', 'arguments': {}},
    })
    readings = json.loads(response.json()['result']['content'][0]['text'])

    assert [r['id'] for r in readings] == [alices['id']]
