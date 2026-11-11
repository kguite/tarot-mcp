# Access

Who can see and do what in the tarot app. This is the design the HTTP and token steps build
against. It's shaped like the access model speak_friend and the country dashboard are heading
toward, so building it here is practice for that.

## Two dials

Every person sits at a position on two separate dials.

| Dial | Question | Tarot | speak_friend / country dashboard |
| --- | --- | --- | --- |
| **What kinds** | Which features and fields? | Level: Free, Journal, Full | Org type: public prices, sensitive, confidential |
| **Which rows** | Whose data? | Your readings, plus your circles' shared ones | Your country's programs and scenarios |

Keep them apart. "Gates sees all countries with sensitive prices" is two answers, one per dial.

## Words

| Term | Means | Tarot example |
| --- | --- | --- |
| Authentication | Who are you? | Logged in as Katie |
| Token (JWT) | Signed proof of who you are, carrying claims | Issued by the auth server, checked on every request |
| Claim | One fact in the token | `sub`, `permissions`, `circles` |
| Authorization | What are you allowed to do? | May write in the journal |
| Level (plan, tier, role) | A named bundle of permissions | Journal |
| Permission | One yes or no, named `action:thing` | `write:journal` |
| Attribute | Which ones, rather than what kind | `circles: ["full-moon"]` |
| Preference | Your choice among what's unlocked | Mode = Journal |
| Row-level filtering | Only the rows you're allowed | Only your readings and your circles' shared ones |
| Column-level filtering | Only the fields you're allowed | (speak_friend: confidential price columns) |

## Dial 1: levels and permissions

| Level | Name | For | speak_friend parallel |
| --- | --- | --- | --- |
| 0 | Public | No login at all: look up cards, read the guide | Public: reference data only |
| 1 | Free | Trying it out: one card, learning the cards | |
| 2 | Journal | The pretend paid upgrade: 3-card spreads and a journal | |
| 3 | Full | Everything: bigger spreads, circles, quiet mode | |

**Admin** is a role, not a plan: it adds `read:all-circles` on top of a level, the way the
country dashboard's superadmin can see every country, or Level Q would see everything.

| Permission | Unlocks | Public | Free | Journal | Full |
| --- | --- | :-: | :-: | :-: | :-: |
| `read:cards` | Card lookup, the guide, Learn more | yes | yes | yes | yes |
| `draw:one-card` | One card spread | | yes | yes | yes |
| `use:learn-mode` | Learn mode | | yes | yes | yes |
| `draw:three-card` | Past, present, future; Situation, obstacle, advice | | | yes | yes |
| `use:journal-mode` | Journal mode | | | yes | yes |
| `write:journal` | Saving readings and reflections | | | yes | yes |
| `read:journal` | Your journal history | | | yes | yes |
| `read:card-details` | The `details` field on a card (tappable prompts) | | | yes | yes |
| `draw:advanced` | The four elements, Celtic Cross | | | | yes |
| `use:simple-mode` | Simple (quiet) mode | | | | yes |
| `share:circle` | Sharing a reading to a circle | | | | yes |
| `read:all-circles` | Every circle's shared readings (admin only) | | | | |

`read:card-details` is the field-level practice: the same `get_card` call returns fewer fields
without it, the way confidential price columns would be left out for most orgs.

## Dial 2: whose readings (circles)

A **circle** is a small group, like a country team. Test circles are named for moon phases:
`new-moon`, `crescent`, `half-moon`, `full-moon`. Each reading has:
- `owner_id`: who saved it
- `visibility`: `private` (only the owner) or `circle`
- `circle_id`: which circle, when shared

**Read rule:** you can see a reading if you own it, or if it's shared to a circle you belong to.

```
owner_id = me  OR  (visibility = 'circle' AND circle_id IN my circles)
```

**Owner-only:** changing visibility, editing, deleting. A circle member can read a shared
reading but never change it. A copy of someone else's reading is always private to you.

## Rules

1. **Code checks permissions, never levels or names.** One table maps each level to its
   permissions. Everything else asks "has `write:journal`?", never "is level 2?" or "is
   Gates?". Adding a level is one table edit.
2. **Data says what it needs, not which level.** A spread carries
   `requires: "draw:three-card"` instead of a numeric `level`.
3. **The server enforces. The UI only hides.** A hidden button is courtesy; the tool refusing
   is the security.
4. **Two kinds of no.**
   - A tool you can't use is left off your menu: a Free user's Claude never sees `save_reading`.
   - A choice you can't make inside a tool you can use is refused with the reason:
     `draw_cards` for the Celtic Cross at Journal returns "needs `draw:advanced`".
5. **Permissions say what kind. Attributes say which ones.** `circles` is a list in the token,
   not one permission per circle (and `countries` would be the same, not 190 permissions).
6. **Permissions and row filtering are separate locks.** `read:journal` lets you open the
   journal; the read rule decides which readings are in it. You need both.
7. **401 versus 403.** 401: no token, or a bad one (wrong signature, expired, wrong issuer or
   audience). 403: a good token that isn't allowed this. speak_friend's README uses the same
   split.
8. **Every persona has a test**, including what it must NOT see.

## Test personas

| Persona | Level | Circles | Must see | Must NOT see |
| --- | --- | --- | --- | --- |
| No token | Public | | Cards | Any reading, `details`, drawing |
| Fern | Free | | One card spread | 3-card spreads, journal tools on the menu |
| Juniper | Journal | `crescent` | Own readings, `details` | Celtic Cross, other circles |
| Rowan | Full | `full-moon`, `crescent` | Own readings, both circles' shared ones | `new-moon` readings |
| Sage | Full + admin | | Every circle's shared readings | Other people's private readings |

The last cell matters: even an admin doesn't see private readings. "Sees everything" is a
choice, and here it stops at shared ones.

## Token or database?

| Put it in the token | Look it up per request |
| --- | --- |
| Fast, no database call | Always current |
| Stale until the token refreshes: an upgrade or a new circle doesn't show yet | One more query per request |

Plan: permissions in the token (Auth0's role-based access works this way), circle membership
looked up in the database. The country dashboard does the same for teams: membership is a
`UserLocationRole` row, checked per request.

## How this maps to work

**Country dashboard, today (verified 2026-11-10):** saved runs (scenarios) have
`visibility: "private" | "team"`. The read rule in `apps/backend/src/routes/runs.ts` is "this
country's runs, where I'm the owner or visibility is team". "Team" means every user with a role
for that country. Only the owner can change sharing, and a copy is always private. Tarot circles
mirror this exactly.

**speak_friend, today:** one door. `src/auth.py` checks the token (signature, issuer,
audience, expiry) and that `workspace_email` is from an allowed domain. Everyone let in gets the
same data. No permissions or rows are checked yet.

**speak_friend, a pretend future for practice (nothing here is decided):**

| Who | Which countries | Which prices |
| --- | --- | --- |
| Public | None, reference data only | Public |
| Country1 user | Country1 | Open question |
| Public health org | All | Public |
| Gates Foundation | All | Sensitive |
| Level Q / Linksbridge | All | Confidential, everything |

Org type sets the price dial (permissions such as `read:prices-sensitive`). The org's country
sets the row dial (an attribute such as `countries: ["NGA"]`). The API enforces both; the
dashboard just displays what comes back.

## Build order

1. `list_spreads` and `draw_cards` on the local server, no access checks yet. (Done.)
2. Move the server to HTTP.
3. Test tokens, signed both ways work signs them: a shared secret (the country dashboard's
   session cookie, `jose`) and a key pair (Auth0's RS256, the way speak_friend's tests fake
   Auth0). Decode one and read its claims. Cookie for the browser app versus Bearer header
   for MCP. 401 versus 403. A pytest test per persona.
4. Dial 1: Public with no token, filter `list_spreads` by permission, leave out `details` without
   `read:card-details`, and build each person's menu from their token.
5. Dial 2: readings in Supabase Postgres with owner and visibility, the read rule as a SQL
   `WHERE` in app code (the way the country dashboard and speak_friend filter), circles, the
   admin override.
6. Real login with Auth0: roles that put permissions in the token, a custom claim, and the
   server telling MCP clients where to log in, so claude.ai can connect.
7. Optional: the same read rule as Postgres row-level security, to compare with filtering in
   app code.
