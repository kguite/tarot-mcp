import asyncio
import json

from mcp import Client

from server import mcp


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
