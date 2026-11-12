import pytest

import journal


# Journal tests write to a temporary file, never the real data/readings.json.
@pytest.fixture
def empty_journal(monkeypatch, tmp_path):
    monkeypatch.setattr(journal, 'PATH', tmp_path / 'readings.json')
