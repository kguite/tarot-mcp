"""The journal: each reading, the cards in it, and the reflection written about it.

Three Postgres tables in Supabase (schema.sql). The app, Claude on this laptop, and the hosted
server all read and write the same rows, so each sees the others' saves.

Every reading has an owner (user_id, the Auth0 `sub`), and every function takes the user: nobody
can read or change another person's readings.
"""
import os
from datetime import timezone
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg import sql
from psycopg.rows import dict_row

# Locally DATABASE_URL comes from mcp-server/.env (git-ignored); Render sets it in its dashboard.
load_dotenv(Path(__file__).parent / '.env')

# Tests point this at the 'test' schema, a copy of the tables they can empty freely.
SCHEMA = 'public'


def connect():
    conn = psycopg.connect(os.environ['DATABASE_URL'], row_factory=dict_row)
    conn.execute(sql.SQL('set search_path to {}').format(sql.Identifier(SCHEMA)))
    return conn


def iso(when):
    # Same format as JavaScript's toISOString, so dates sort and show the same in the app and here.
    return when.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def add_reading(user_id, spread_id, cards, body, created_at=None):
    """cards: (position_id, card_id, reversed) in position order. created_at only for seeding the past.
    Returns the new reading's id."""
    with connect() as conn:
        id = conn.execute(
            'insert into readings (user_id, spread_id, created_at) values (%s, %s, coalesce(%s, now())) returning id::text',
            (user_id, spread_id, created_at),
        ).fetchone()['id']
        conn.cursor().executemany(
            'insert into reading_cards (reading_id, position, position_id, card_id, reversed) values (%s, %s, %s, %s, %s)',
            [(id, i, position_id, card_id, reversed_) for i, (position_id, card_id, reversed_) in enumerate(cards)],
        )
        if body:
            conn.execute(
                "insert into entries (reading_id, type, body, created_at) values (%s, 'interpretation', %s, coalesce(%s, now()))",
                (id, body, created_at),
            )
    return id


def set_reflection(user_id, reading_id, body):
    """Returns False when the user has no such reading (someone else's counts as none)."""
    with connect() as conn:
        # id::text, so an id that isn't a uuid at all is "no such reading", not a database error.
        if not conn.execute('select 1 from readings where id::text = %s and user_id = %s', (reading_id, user_id)).fetchone():
            return False
        conn.execute(
            """insert into entries (reading_id, type, body) values (%s, 'interpretation', %s)
               on conflict (reading_id) where type = 'interpretation'
               do update set body = excluded.body, updated_at = now()""",
            (reading_id, body),
        )
    return True


def all_readings(user_id):
    """The user's readings with their cards and entries, newest first."""
    with connect() as conn:
        readings = conn.execute(
            'select id::text as id, user_id, spread_id, created_at from readings where user_id = %s order by created_at desc',
            (user_id,),
        ).fetchall()
        ids = [r['id'] for r in readings]
        cards = conn.execute(
            'select reading_id::text as reading_id, position, position_id, card_id, reversed from reading_cards'
            ' where reading_id = any(%s::uuid[]) order by position',
            (ids,),
        ).fetchall()
        entries = conn.execute(
            'select id::text as id, reading_id::text as reading_id, type, body, created_at, updated_at from entries'
            ' where reading_id = any(%s::uuid[]) order by created_at',
            (ids,),
        ).fetchall()

    for e in entries:
        e['created_at'] = iso(e['created_at'])
        e['updated_at'] = e['updated_at'] and iso(e['updated_at'])
    for r in readings:
        r['created_at'] = iso(r['created_at'])
        r['cards'] = [c for c in cards if c['reading_id'] == r['id']]
        r['entries'] = [e for e in entries if e['reading_id'] == r['id']]
    return readings


def clear(user_id):
    """Delete all of one user's readings; their cards and entries go with them."""
    with connect() as conn:
        conn.execute('delete from readings where user_id = %s', (user_id,))
