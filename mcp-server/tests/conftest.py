import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

import auth
import journal

# A throwaway key standing in for Auth0's: tests sign real tokens with it, and the server is told
# to trust it instead of downloading Auth0's keys, so no test ever calls Auth0.
KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


# Journal tests write to a temporary file, never the real data/readings.json.
@pytest.fixture
def empty_journal(monkeypatch, tmp_path):
    monkeypatch.setattr(journal, 'PATH', tmp_path / 'readings.json')


@pytest.fixture
def login(monkeypatch):
    """login('alice') gives the headers of a request from that user, with a token shaped like Auth0's."""
    monkeypatch.setattr(auth.jwks_client, 'get_signing_key_from_jwt', lambda token: SimpleNamespace(key=KEY.public_key()))

    def headers(sub, audience=auth.AUTH0_AUDIENCE):
        claims = {'sub': sub, 'iss': auth.AUTH0_ISSUER, 'aud': audience, 'exp': int(time.time()) + 300, 'azp': 'test'}
        return {'Authorization': f"Bearer {jwt.encode(claims, KEY, algorithm='RS256')}"}

    return headers
