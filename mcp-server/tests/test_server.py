import asyncio
import json
from typing import get_args

import pytest
from mcp import Client, MCPError

from server import CARDS, SYMBOLS, WAITE, Facing, Pose, mcp, rng


# Client(mcp) runs the server in-process: the same calls Claude makes, no subprocess.
# ask(lambda client: client.list_tools()) opens a client, makes one call, and returns the result.
def ask(request):
    async def run():
        async with Client(mcp) as client:
            return await request(client)
    return asyncio.run(run())


def call(tool, arguments):
    return ask(lambda client: client.call_tool(tool, arguments))


def call_json(tool, arguments):
    return json.loads(call(tool, arguments).content[0].text)


# The menu Claude reads lists get_card with its description and an id input.
def test_menu_lists_get_card():
    tools = {tool.name: tool for tool in ask(lambda client: client.list_tools()).tools}

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


# Symbol ids are typed by hand, so a typo would silently drop a card from find_cards.
def test_symbol_ids_line_up():
    symbol_ids = {s['id'] for s in SYMBOLS}
    used = set()
    for card in CARDS:
        assert set(card['symbols']) <= symbol_ids, card['id']
        for detail in card['details']:
            assert set(detail['symbols']) <= set(card['symbols']), (card['id'], detail['id'])
        used |= set(card['symbols'])

    assert used == symbol_ids


def test_full_deck_with_every_field():
    fields = {'summary', 'meaning', 'advice', 'affirmation', 'as_a_person', 'facing', 'pose'}
    assert len(CARDS) == 78
    for card in CARDS:
        assert fields <= card.keys(), card['id']
        assert card['facing'] in {None, *get_args(Facing)}, card['id']
        assert card['pose'] in {None, *get_args(Pose)}, card['id']


def test_every_card_has_waite_text():
    assert {c['id'] for c in CARDS} == {c['id'] for c in WAITE['cards']}


# The question the data shape was for: other cards with pillars, and what pillars mean.
def test_find_cards_by_symbol():
    found = call_json('find_cards', {'symbol': 'pillars'})

    assert [c['id'] for c in found['cards']] == ['high-priestess', 'hierophant', 'justice', 'death']
    assert found['symbol']['name'] == 'Pillars'


# Filters combine: heights appear on the Fool, Hermit, Temperance and Tower too, but only two are Wands.
def test_find_cards_filters_combine():
    found = call_json('find_cards', {'symbol': 'heights', 'suit': 'wands'})

    assert [c['id'] for c in found['cards']] == ['three-of-wands', 'seven-of-wands']


def test_find_cards_by_rank():
    found = call_json('find_cards', {'rank': 7})

    assert [c['id'] for c in found['cards']] == ['seven-of-wands', 'seven-of-cups', 'seven-of-swords', 'seven-of-pentacles']


# Pose and facing come from the art: who is falling, and whose back is turned, in one suit.
def test_find_cards_by_pose_and_facing():
    falling = call_json('find_cards', {'pose': 'falling'})
    away_cups = call_json('find_cards', {'facing': 'away', 'suit': 'cups'})

    assert [c['id'] for c in falling['cards']] == ['tower']
    assert [c['id'] for c in away_cups['cards']] == ['seven-of-cups', 'eight-of-cups', 'ten-of-cups']


# Bad input is an error Claude can read: an unknown symbol lists the valid ones, a bad suit fails the schema.
def test_find_cards_bad_input():
    assert call('find_cards', {}).is_error
    unknown = call('find_cards', {'symbol': 'pilars'})
    assert unknown.is_error and 'pillars' in unknown.content[0].text
    assert call('find_cards', {'suit': 'hearts'}).is_error


# Every spread is listed with its positions, so Claude can pick one by id.
def test_list_spreads():
    spreads = call_json('list_spreads', {})

    assert [s['id'] for s in spreads][:2] == ['single', 'past-present-future']
    assert spreads[1]['positions'] == ['Past', 'Present', 'Future']


# A draw has one card per position, in order, with no card drawn twice. Random, so check what is always true.
def test_draw_cards_fills_each_position_once():
    draws = call_json('draw_cards', {'spread_id': 'celtic-cross'})

    assert len(draws) == 10
    assert draws[0]['position'] == 'The heart of the matter'
    assert len({d['card_id'] for d in draws}) == 10


# Pinning the random number forces a reversal, so the reversed keywords can be checked.
def test_draw_cards_reversed_uses_reversed_keywords(monkeypatch):
    monkeypatch.setattr(rng, 'random', lambda: 0.0)

    draw = call_json('draw_cards', {'spread_id': 'single'})[0]
    card = next(c for c in CARDS if c['id'] == draw['card_id'])

    assert draw['reversed']
    assert draw['keywords'] == card['keywords']['reversed']


# An unknown spread is an error that lists the valid ids.
def test_draw_cards_unknown_spread_lists_valid_ids():
    result = call('draw_cards', {'spread_id': 'three-card'})

    assert result.is_error
    assert 'past-present-future' in result.content[0].text


def read_waite(card_id):
    return ask(lambda client: client.read_resource(f'tarot://waite/{card_id}')).contents[0].text


# A resource with {id} in it is listed as a template, not as one resource per card.
def test_waite_is_a_resource_template():
    templates = ask(lambda client: client.list_resource_templates()).resource_templates

    assert 'tarot://waite/{id}' in [t.uri_template for t in templates]


# Reading a card returns Waite's own words and the credit line.
def test_waite_moon():
    text = read_waite('moon')

    assert 'The path between the towers is the issue into the unknown.' in text
    assert 'Upright: Hidden enemies, danger' in text
    assert 'Source: Arthur Edward Waite' in text


# Waite gives the Two of Cups no reversed meaning, so the resource leaves that line out.
def test_waite_two_of_cups_has_no_reversed_line():
    text = read_waite('two-of-cups')

    assert 'Upright: Love, passion' in text
    assert 'Reversed:' not in text


# An unknown card is a protocol error for the app, not a result Claude reads.
# It's caught inside the async with, because escaping it wraps the error in an ExceptionGroup.
def test_waite_unknown_card_is_a_protocol_error():
    async def run():
        async with Client(mcp) as client:
            with pytest.raises(MCPError, match="No Waite text for 'the-moon'"):
                await client.read_resource('tarot://waite/the-moon')
    asyncio.run(run())


# The prompt is on the prompts menu with an optional question.
def test_daily_draw_is_listed():
    prompts = {p.name: p for p in ask(lambda client: client.list_prompts()).prompts}

    assert prompts['daily_draw'].arguments[0].name == 'question'
    assert not prompts['daily_draw'].arguments[0].required


# The question goes into the message, and Claude is told to hold back the meaning.
def test_daily_draw_includes_question_and_waits():
    result = ask(lambda client: client.get_prompt('daily_draw', {'question': 'What needs my attention?'}))
    text = result.messages[0].content.text

    assert 'What needs my attention?' in text
    assert "Don't share keywords or meanings until I have written my first impression" in text
