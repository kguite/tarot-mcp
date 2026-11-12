"""An MCP server with no SDK: read one JSON message per line on stdin, answer on stdout.

Everything @mcp.tool does in server.py is written out by hand here.
"""
import json
import sys

KEYWORDS = {'fool': 'beginnings', 'moon': 'intuition', 'tower': 'upheaval'}

# The menu. This dict is exactly what Claude reads; @mcp.tool builds it from a function's
# name, docstring and type hints.
TOOLS = [{
    'name': 'get_keyword',
    'description': 'One keyword for a tarot card.',
    'inputSchema': {
        'type': 'object',
        'properties': {'card': {'type': 'string', 'description': 'fool, moon or tower'}},
        'required': ['card'],
    },
}]


def call_tool(name, arguments):
    card = arguments.get('card')
    if name != 'get_keyword' or card not in KEYWORDS:
        # A tool error is a normal result with isError: Claude reads it and can try again.
        return {'content': [{'type': 'text', 'text': f'No card {card!r}. Try one of: {", ".join(KEYWORDS)}'}], 'isError': True}
    return {'content': [{'type': 'text', 'text': KEYWORDS[card]}]}


def handle(request):
    method = request['method']
    params = request.get('params', {})
    if method == 'initialize':
        # Agree on a protocol version and say what this server offers (tools only).
        return {
            'protocolVersion': params['protocolVersion'],
            'capabilities': {'tools': {}},
            'serverInfo': {'name': 'raw-tarot', 'version': '0.1'},
        }
    if method == 'tools/list':
        return {'tools': TOOLS}
    if method == 'tools/call':
        return call_tool(params['name'], params.get('arguments', {}))
    # Anything else is a protocol error for the client app, not something Claude sees.
    raise LookupError(method)


for line in sys.stdin:
    request = json.loads(line)
    # A message with no id is a notification (like notifications/initialized): never answered.
    if 'id' not in request:
        continue
    try:
        reply = {'jsonrpc': '2.0', 'id': request['id'], 'result': handle(request)}
    except LookupError as error:
        reply = {'jsonrpc': '2.0', 'id': request['id'], 'error': {'code': -32601, 'message': f'Method not found: {error}'}}
    # stdout is the channel to the client, so this print is the reply. Logs would go to stderr.
    print(json.dumps(reply), flush=True)
