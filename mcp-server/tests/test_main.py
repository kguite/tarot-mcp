import pytest
from fastapi.testclient import TestClient

from main import app

MCP_HEADERS = {'Accept': 'application/json, text/event-stream', 'Content-Type': 'application/json'}


# "with" runs the app's startup, which MCP needs. The base URL matches the host MCP accepts.
@pytest.fixture(scope='module')
def client():
    with TestClient(app, base_url='http://127.0.0.1:8000') as c:
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


# The same server answers MCP at /mcp: the first message of the handshake, over HTTP.
def test_mcp_over_http(client):
    response = client.post('/mcp', headers=MCP_HEADERS, json={
        'jsonrpc': '2.0', 'id': 1, 'method': 'initialize',
        'params': {'protocolVersion': '2025-06-18', 'capabilities': {},
                   'clientInfo': {'name': 'test', 'version': '0'}},
    })

    assert response.status_code == 200
    assert response.json()['result']['serverInfo']['name'] == 'tarot'
