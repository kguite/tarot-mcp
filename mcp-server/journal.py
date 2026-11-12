"""The journal: each reading, the cards in it, and the reflection written about it.

A JSON file stands in for the database, shaped like its future tables (the same shape store.ts
used in the browser). The app and Claude run as two processes, so every call reads the file fresh
and each sees the other's saves.
"""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

PATH = Path(__file__).parent / 'data' / 'readings.json'


def load():
    if not PATH.exists():
        return {'readings': [], 'reading_cards': [], 'entries': []}
    return json.loads(PATH.read_text(encoding='utf-8'))


def persist(db):
    PATH.parent.mkdir(exist_ok=True)
    PATH.write_text(json.dumps(db, indent=2), encoding='utf-8')


def now():
    # Same format as JavaScript's toISOString, so dates sort the same in the app and here.
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def add_reading(spread_id, cards, body):
    """cards: (position_id, card_id, reversed) in position order. Returns the new reading's id."""
    db = load()
    id = str(uuid.uuid4())
    created = now()
    db['readings'].append({'id': id, 'spread_id': spread_id, 'created_at': created})
    for i, (position_id, card_id, reversed_) in enumerate(cards):
        db['reading_cards'].append({'reading_id': id, 'position': i, 'position_id': position_id, 'card_id': card_id, 'reversed': reversed_})
    if body:
        db['entries'].append({'id': str(uuid.uuid4()), 'reading_id': id, 'type': 'interpretation', 'body': body, 'created_at': created})
    persist(db)
    return id


def set_reflection(reading_id, body):
    """Returns False when there is no such reading."""
    db = load()
    if not any(r['id'] == reading_id for r in db['readings']):
        return False
    entry = next((e for e in db['entries'] if e['reading_id'] == reading_id and e['type'] == 'interpretation'), None)
    if entry:
        entry['body'] = body
        entry['updated_at'] = now()
    else:
        db['entries'].append({'id': str(uuid.uuid4()), 'reading_id': reading_id, 'type': 'interpretation', 'body': body, 'created_at': now()})
    persist(db)
    return True


def all_readings():
    """Every reading with its cards and entries, newest first, like a select with relations."""
    db = load()
    return [
        {
            **r,
            'cards': sorted((c for c in db['reading_cards'] if c['reading_id'] == r['id']), key=lambda c: c['position']),
            'entries': sorted((e for e in db['entries'] if e['reading_id'] == r['id']), key=lambda e: e['created_at']),
        }
        for r in sorted(db['readings'], key=lambda r: r['created_at'], reverse=True)
    ]
