"""Replace the journal with a pretend six weeks of readings, for trying the tools and for demos.

Run from mcp-server: .venv\\Scripts\\python.exe seed.py
The journal of Grizelda, the Wicked Witch of the Cul-de-sac: obviously made up, so a demo shows
nobody's real life. Built-in patterns to find: the Moon keeps coming up while she agonizes over
entering Villain of the Year, Cups cluster in late October around her old rival Bertha, and the
Eight of Cups appears twice as she thinks about leaving her coven.

The readings belong to SEED_USER (an Auth0 user id, like "github|12345"), so they show up when that
person logs in. Without it they go to TAROT_USER, the local no-login user.
"""
import os
import uuid

import journal
from auth import LOCAL_USER
from server import CARDS, SPREADS, by_id

OWNER = os.getenv('SEED_USER', LOCAL_USER)

# (when in UTC, spread, cards in position order with '-r' for reversed, reflection)
READINGS = [
    ('2026-10-01T07:40', 'single', ['moon'], 'The Villain of the Year nominations opened at midnight. The Moon, of course. I cannot see the shape of my ambitions through all this fog I conjured.'),
    ('2026-10-02T08:05', 'single', ['page-of-pentacles'], 'Signed up for a beginner cauldron-throwing class. Humbling. The other students are mostly toads I made.'),
    ('2026-10-04T21:15', 'past-present-future', ['five-of-cups', 'moon', 'star'], "Past: still sore about not being invited to the Hendersons' barbecue. Moon in the middle again. The Star felt like permission to hope without cursing anyone. Yet."),
    ('2026-10-06T07:30', 'single', ['two-of-swords'], ''),
    ('2026-10-08T07:55', 'single', ['knight-of-pentacles-r'], 'Reversed Knight of Pentacles. I have not finished a single curse this week and am calling it "letting them marinate."'),
    ('2026-10-11T10:20', 'situation-obstacle-advice', ['eight-of-cups', 'four-of-swords', 'page-of-cups'], 'Eight of Cups. Thinking about leaving the coven, even though the potluck is still good. Obstacle: I am tired, and the raven needs walking. Advice: stay playful.'),
    ('2026-10-13T07:35', 'single', ['moon'], 'Third Moon this month. Villain of the Year interviews are Friday. I keep picturing the cape, not the villainy.'),
    ('2026-10-16T22:00', 'single', ['strength'], 'Interview done. Did not turn a single judge into a newt. Strength as quiet, not loud. Personal growth.'),
    ('2026-10-19T08:10', 'single', ['three-of-cups'], 'Bertha sent a raven out of nowhere. We have not spoken since the Great Broomstick Incident.'),
    ('2026-10-21T20:45', 'past-present-future', ['six-of-cups', 'two-of-cups', 'ace-of-cups'], 'All cups. An old rivalry, a real conversation, and something new brewing in it. Talked to Bertha for two hours. The cauldron boiled over twice.'),
    ('2026-10-23T07:50', 'single', ['ten-of-cups-r'], 'Family dinner went sideways. My sister enchanted the gravy again. The picture-perfect version is not the only good version.'),
    ('2026-10-26T09:30', 'elements', ['ace-of-wands', 'queen-of-cups', 'moon-r', 'eight-of-pentacles'], 'Fire: the cauldron wheel finally clicked. Water: listening more than cackling. Air: the Moon reversed, the fog lifting a little? Earth: practice, practice.'),
    ('2026-10-28T07:45', 'single', ['knight-of-cups'], ''),
    ('2026-10-30T21:30', 'single', ['tower'], 'They gave Villain of the Year to a man whose whole thing is a monocle. A MONOCLE.'),
    ('2026-11-02T08:00', 'situation-obstacle-advice', ['eight-of-cups', 'moon', 'temperance'], 'Eight of Cups again, Moon again. I think I already know I am done with the coven. I just do not know what comes after. Temperance: no rush, stir slowly.'),
    ('2026-11-05T07:40', 'single', ['four-of-cups'], 'Declined the runner-up sash. Four of Cups is funny timing: I am not saying no to everything, just to this cup.'),
    ('2026-11-08T10:15', 'single', ['star'], 'Lighter. Threw a lopsided cauldron and love it. The raven approves.'),
    ('2026-11-10T07:30', 'past-present-future', ['tower', 'hermit', 'page-of-wands'], 'Past: the monocle debacle. Present: Hermit, figuring out what kind of witch I want to be on my own terms. Page of Wands as a question: what would I try if it were small?'),
]


def seed():
    db = {'readings': [], 'reading_cards': [], 'entries': []}
    for when, spread_id, cards, body in READINGS:
        created = f'{when}:00.000Z'
        id = str(uuid.uuid4())
        db['readings'].append({'id': id, 'user_id': OWNER, 'spread_id': spread_id, 'created_at': created})
        for i, (position, card) in enumerate(zip(by_id(SPREADS, spread_id)['positions'], cards, strict=True)):
            card_id = card.removesuffix('-r')
            assert by_id(CARDS, card_id), card_id
            db['reading_cards'].append({'reading_id': id, 'position': i, 'position_id': position['id'], 'card_id': card_id, 'reversed': card.endswith('-r')})
        if body:
            db['entries'].append({'id': str(uuid.uuid4()), 'reading_id': id, 'type': 'interpretation', 'body': body, 'created_at': created})
    journal.persist(db)
    print(f'Wrote {len(READINGS)} readings for {OWNER} to {journal.PATH}')


if __name__ == '__main__':
    seed()
