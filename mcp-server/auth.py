"""Who is asking: one check of an Auth0 access token, used by the REST endpoints and /mcp alike
(the same split as speak_friend's src/auth.py), plus this server's public address.

A token passes if Auth0 signed it, it hasn't expired, and it was issued by our tenant for this
API. Its `sub` (the Auth0 user id) is whose journal the request reads and writes.
"""
import asyncio
import os
from urllib.parse import urlparse

import jwt
from mcp.server.auth.provider import AccessToken

# Not secrets: the tenant and the API identifier are public, and every token names them anyway.
AUTH0_ISSUER = os.getenv('AUTH0_ISSUER', 'https://dev-khp3k0qx6qktdf5u.us.auth0.com/')
AUTH0_AUDIENCE = os.getenv('AUTH0_AUDIENCE', 'https://tarot-api-5c7k.onrender.com')

# Locally over stdio (Claude Code on your laptop) there is no login, so readings belong to this id.
LOCAL_USER = os.getenv('TAROT_USER', 'local')

# This server's public address. MCP only accepts requests addressed to this host.
# On Render it's the service's own URL, which Render sets as RENDER_EXTERNAL_URL.
# Port 8001 locally, since the work API (lb_database_api) already runs on uvicorn's default 8000.
MCP_SERVER_URL = urlparse(os.getenv('MCP_SERVER_URL') or os.getenv('RENDER_EXTERNAL_URL', 'http://127.0.0.1:8001') + '/mcp')

# Fetches Auth0's public signing keys on first use, then caches them.
jwks_client = jwt.PyJWKClient(f'{AUTH0_ISSUER}.well-known/jwks.json')


class AccessDenied(Exception):
    """The token is missing, forged, expired, or for another API."""


def verify(token: str) -> dict:
    """The token's claims if it passes; AccessDenied if not."""
    try:
        key = jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(token, key.key, algorithms=['RS256'], audience=AUTH0_AUDIENCE, issuer=AUTH0_ISSUER)
    except jwt.PyJWTError as error:
        raise AccessDenied(str(error)) from error


class Auth0TokenVerifier:
    """The MCP library calls this for every /mcp request; None becomes a 401 with where to log in."""

    async def verify_token(self, token: str) -> AccessToken | None:
        try:
            # On a worker thread: the first call downloads Auth0's keys.
            claims = await asyncio.to_thread(verify, token)
        except AccessDenied:
            return None
        return AccessToken(
            token=token,
            client_id=claims.get('azp', ''),
            scopes=claims.get('scope', '').split(),
            expires_at=claims.get('exp'),
            subject=claims['sub'],
            claims=claims,
        )
