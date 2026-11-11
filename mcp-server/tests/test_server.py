import asyncio
import json

from mcp import Client

from server import CARDS, mcp, rng


# Client(mcp) runs the server in-process: the same calls Claude makes, no subprocess.
def call(tool, arguments):
    async def run():
        async with Client(mcp) as client:
            return await client.call_tool(tool, arguments)
    return asyncio.run(run())


# The menu Claude reads lists get_card with its description and an id input.
def test_menu_lists_get_card():
    async def run():
        async with Client(mcp) as client:
            return await client.list_tools()
    tools = {tool.name: tool for tool in asyncio.run(run()).tools}

    assert 'get_card' in tools
    assert tools['get_card'].description.startswith('Look up one tarot card by id')
    assert tools['get_card'].input_schema['required'] == ['id']


# A known id returns that card's data, once, as text.
def test_get_card_returns_the_card():
    result = call('get_card', {'id': 'moon'})

    assert not result.is_error
    assert len(result.content) == 1
    assert result.structured_content is None
    assert json.loads(result.content[0].text)['name'] == 'The Moon'


# An unknown id is an error Claude can recover from: it lists the valid ids.
def test_get_card_unknown_id_lists_valid_ids():
    result = call('get_card', {'id': 'the-moon'})

    assert result.is_error
    assert "No card with id 'the-moon'" in result.content[0].text
    assert 'moon' in result.content[0].text


# Every spread is listed with its positions, so Claude can pick one by id.
def test_list_spreads():
    spreads = json.loads(call('list_spreads', {}).content[0].text)

    assert [s['id'] for s in spreads][:2] == ['single', 'past-present-future']
    assert spreads[1]['positions'] == ['Past', 'Present', 'Future']


# A draw has one card per position, in order, with no card drawn twice. Random, so check what is always true.
def test_draw_cards_fills_each_position_once():
    draws = json.loads(call('draw_cards', {'spread_id': 'celtic-cross'}).content[0].text)

    assert len(draws) == 10
    assert draws[0]['position'] == 'The heart of the matter'
    assert len({d['card_id'] for d in draws}) == 10


# Pinning the random number forces a reversal, so the reversed keywords can be checked.
def test_draw_cards_reversed_uses_reversed_keywords(monkeypatch):
    monkeypatch.setattr(rng, 'random', lambda: 0.0)

    draw = json.loads(call('draw_cards', {'spread_id': 'single'}).content[0].text)[0]
    card = next(c for c in CARDS if c['id'] == draw['card_id'])

    assert draw['reversed']
    assert draw['keywords'] == card['keywords']['reversed']


# An unknown spread is an error that lists the valid ids.
def test_draw_cards_unknown_spread_lists_valid_ids():
    result = call('draw_cards', {'spread_id': 'three-card'})

    assert result.is_error
    assert 'past-present-future' in result.content[0].text
