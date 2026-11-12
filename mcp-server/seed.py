"""Replace the journal with a pretend six weeks of readings, for trying the tools and for demos.

Run from mcp-server: .venv\\Scripts\\python.exe seed.py
Built-in patterns to find: the Moon keeps coming up around a job decision, Cups cluster in late
October around an old friend, and the Eight of Cups appears twice.
"""
import uuid

import journal
from server import CARDS, SPREADS, by_id

# (when in UTC, spread, cards in position order with '-r' for reversed, reflection)
READINGS = [
    ('2026-10-01T07:40', 'single', ['moon'], "Recruiter email last night about the Denver role. Moon feels right: I can't see the shape of it yet."),
    ('2026-10-02T08:05', 'single', ['page-of-pentacles'], 'Signed up for the Thursday pottery class. Beginner energy, and that is fine.'),
    ('2026-10-04T21:15', 'past-present-future', ['five-of-cups', 'moon', 'star'], "Past is the team reshuffle I'm still a little sore about. Moon again in the middle. The Star felt like permission to hope without deciding anything."),
    ('2026-10-06T07:30', 'single', ['two-of-swords'], ''),
    ('2026-10-08T07:55', 'single', ['knight-of-pentacles-r'], 'Reversed Knight of Pentacles. I have been slow on everything this week and calling it careful.'),
    ('2026-10-11T10:20', 'situation-obstacle-advice', ['eight-of-cups', 'four-of-swords', 'page-of-cups'], 'Eight of Cups as the situation. Walking away from something that still looks full. Obstacle is that I am tired. Advice: stay curious, let it be playful.'),
    ('2026-10-13T07:35', 'single', ['moon'], 'Third Moon this month. Second interview is Friday. I notice I keep picturing the drive, not the job.'),
    ('2026-10-16T22:00', 'single', ['strength'], "Interview done. I was calmer than I expected. Strength as quiet, not loud."),
    ('2026-10-19T08:10', 'single', ['three-of-cups'], 'Maya texted out of nowhere. We have not talked since her wedding.'),
    ('2026-10-21T20:45', 'past-present-future', ['six-of-cups', 'two-of-cups', 'ace-of-cups'], "All cups. Old friendship, a real conversation, and something new starting in it. Talked to Maya for two hours."),
    ('2026-10-23T07:50', 'single', ['ten-of-cups-r'], "Family dinner went sideways. Reversed Ten of Cups. The picture-perfect version isn't the only good version."),
    ('2026-10-26T09:30', 'elements', ['ace-of-wands', 'queen-of-cups', 'moon-r', 'eight-of-pentacles'], 'Fire: the pottery wheel finally clicked. Water: listening more than talking. Air: the Moon reversed, the fog lifting a little? Earth: practice, practice.'),
    ('2026-10-28T07:45', 'single', ['knight-of-cups'], ''),
    ('2026-10-30T21:30', 'single', ['tower'], 'Denver offer came in, and it is not what I thought. Lower than my number and in-office five days.'),
    ('2026-11-02T08:00', 'situation-obstacle-advice', ['eight-of-cups', 'moon', 'temperance'], "Eight of Cups again, Moon again. I think I already know I want to leave my team, I just don't know if Denver is the door. Temperance: no rush, mix the two slowly."),
    ('2026-11-05T07:40', 'single', ['four-of-cups'], 'Turned down Denver today. Four of Cups is funny timing: maybe I am not saying no to everything, just to this cup.'),
    ('2026-11-08T10:15', 'single', ['star'], 'Lighter. Made a lopsided bowl and love it.'),
    ('2026-11-10T07:30', 'past-present-future', ['tower', 'hermit', 'page-of-wands'], 'Past: the offer shake-up. Present: Hermit, figuring out what I want on my own terms. The Page of Wands as a question: what would I try if it were small?'),
]


def seed():
    db = {'readings': [], 'reading_cards': [], 'entries': []}
    for when, spread_id, cards, body in READINGS:
        created = f'{when}:00.000Z'
        id = str(uuid.uuid4())
        db['readings'].append({'id': id, 'spread_id': spread_id, 'created_at': created})
        for i, (position, card) in enumerate(zip(by_id(SPREADS, spread_id)['positions'], cards, strict=True)):
            card_id = card.removesuffix('-r')
            assert by_id(CARDS, card_id), card_id
            db['reading_cards'].append({'reading_id': id, 'position': i, 'position_id': position['id'], 'card_id': card_id, 'reversed': card.endswith('-r')})
        if body:
            db['entries'].append({'id': str(uuid.uuid4()), 'reading_id': id, 'type': 'interpretation', 'body': body, 'created_at': created})
    journal.persist(db)
    print(f'Wrote {len(READINGS)} readings to {journal.PATH}')


if __name__ == '__main__':
    seed()
