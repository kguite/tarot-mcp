# Tarot reflection app

A personal learning project: a tarot app for reflection, journaling, and learning tarot. It is not a fortune teller. The cards are prompts for imagination and self-reflection, in the spirit of Rachel Pollack (*Seventy-Eight Degrees of Wisdom*) and Jessica Dore (*Tarot for Change*).

The app is also a vehicle for learning: Vite + React + TypeScript, Supabase (Postgres, RLS, OAuth, Edge Functions, pgvector), MCP servers, and how to design and optimize LLM calls and tools.

## How to work with me

- Explain the why before implementing. I want to understand decisions, not just get code.
- Go piece by piece. Small, working steps over big rewrites.
- Readable, step-by-step code over clever patterns. Don't add helper functions or abstractions unless they remove real repetition.
- Prefer `if/else` over ternaries.
- Prefer `??` over `||` for null and default checks.
- Imports at the top of files.
- When I'm tired or ask for it, give complete rewritten files instead of partial snippets.
- Build from patterns already working in this codebase rather than inventing new ones.
- No em dashes in docs or UI copy.
- I'm on Windows with PowerShell. Give commands that work there.
- Git: branch plus PR for changes.
- This is a learning project. Each step gets a section in `STEPS.md`: what was done, the commands, and why.
- Access (levels, permissions, circles) is designed in `ACCESS.md`. Build against it; it mirrors where speak_friend and the country dashboard are heading.

## Product principles

- **Voice.** Psychology-minded like Jessica Dore, inclusive like Lindsay Mack, in original words. Describe qualities, never gender or looks (Waite's "dark man", "the Querent, if male" are out), court cards included.
- **Reflection, not prediction.** No copy or LLM output that tells someone what will happen. Prompts ask questions; the person interprets.
- **The code draws the cards, never the LLM.** Shuffling and reversals use `crypto.getRandomValues` and Fisher–Yates. An LLM may interpret a draw it is given, never produce one.
- **Small deliberate rituals.** Tap a card to choose it, tap again to turn it over. Keep that two-step reveal.
- **Learn by combining.** A Minor card is suit × number. A Major has a place in Pollack's journey (the Fool, then three rows of seven). Every Major I to X echoes the matching number in the Minors.
- **Quiet by default.** Extra info is opt-in (the Learn more menu, modes), never piled on.
- **Motion with purpose.** Josh Comeau style springs, layered shadows, and small moments of delight (the save sparkles). Always respect `prefers-reduced-motion`.

## Content and copyright

- Do not reproduce text from Pollack's or Dore's books, or any copyrighted tarot book. Write original content in our own words.
- Public domain sources we can use: the 1909 Rider-Waite-Smith card art and A.E. Waite's *The Pictorial Key to the Tarot* (1911).
- The current card faces are placeholders (numeral, symbol, name) until real art is added.
- Credit every source with a link wherever its text or images are used.
- **Waite is source material, not the app's voice.** His meanings are often bleak or dated ("hidden enemies", "the Querent, if male"). `waite.json` keeps his words exactly, for the MCP resource and as the list of what is in each picture (input for `symbols.json`). App text is written fresh in our own tone.
- **Waite's text: Wikisource**, *The Pictorial Key to the Tarot* (1922 William Rider & Son reprint), validated, "in the public domain in the United States". Each Part is a subpage (`/Part_2` has a section per Major). The page scans it was typed from are on Commons as `File:The_Pictorial_Key_to_the_Tarot.pdf` (353 pages, Public Domain Mark): check odd words against it. Fallback: Project Gutenberg #43548, de Laurence's 1916 reprint.
- **Card art: Wikimedia Commons, "Rider-Waite tarot deck (Roses & Lilies)"**: an original 1909 Roses & Lilies deck scanned by Saskia Jansen, about 825 × 1,430 px. Files are `RWS1909 - 18 Moon.jpeg` and `RWS1909 - Cups 01.jpeg` (courts 11 to 14). The Fool's page says public domain in the US and life plus 70 countries; check each file's license when downloading. Avoid recolored sets, which may still be copyrighted.
- **sacred-texts.com** blocks Claude's fetches, so it is a backup to read in the browser. Its public domain files "can be used for any purposes" (credit and link requested). Its own index pages, notes, graphics and J.B. Hare tarot reader are copyrighted. Other public domain books there: Ouspensky, *The Symbolism of the Tarot* (1913); Mathers, *The Tarot* (1888); Papus, *The Tarot of the Bohemians* (1892). Not Thierens (1930): status unknown.
- **The Dark Forest guidebook and journal** (darkforesttarotcards.com, free, "all rights reserved") are for ideas only. The PDF sits at the repo root, ignored by `.gitignore`. Never copy its wording or design.

## Current state

The repo root holds this file and `STEPS.md`. The app lives in `tarot-app/`: a Vite + React + TypeScript project with typed data and a placeholder page. Porting the prototype into it has not started.

The working reference is a single-file HTML prototype (`tarot-app/prototype/draw.html`, about 1,500 lines with data inlined) published as a Claude artifact. It works on mobile and supports light and dark themes. Features:

- **Draw flow:** a fan of 10 face-down cards. Choose cards one at a time into spread positions, then tap each to flip with a 3D spring. About 1 in 4 cards come up reversed (`REVERSAL_RATE`) and are shown upside down.
- **Spreads:** One card; Past, present, future; Situation, obstacle, advice; The four elements. The Celtic Cross is in the data but hidden until the deck is bigger and it has its own layout.
- **Reading panel:** card name, orientation, keywords, the position's prompt and the card's prompt (each with "Write from this"), a reversal note, and a reflection text box.
- **Learn more menu:** opt-in sections for the suit, number, journey row, related cards, and raw card data. Choices carry over between cards.
- **Card sheet:** look up any card in the data by tapping a linked card name.
- **Guide ("How tarot works"):** Major and Minor Arcana, the journey rows, suits and numbers, spreads.
- **Saving and journal:** Save reading (with sparkles), Save changes after edits, and a journal list and detail view. Stored in localStorage through the `store` module.
- **Modes:** Learn (sections open by default), Journal (writing first, keywords hidden), Simple (just the cards, with Reflect and Shuffle again buttons). The mode is remembered.

The prototype's deck in play is 10 cards: The Fool, The Magician, The High Priestess, The Hermit, The Star, The Moon, Seven of Wands, Three of Cups, Five of Swords, Ace of Pentacles, plus seven lookup-only Majors. The app's `cards.json` now has all 78.

## Data

JSON files in `tarot-app/src/data/`, normalized so cards point to shared reference data instead of repeating it. `types.ts` has a type for each file, and `index.ts` exports each one typed (`CARDS`, `SPREADS`, `SUITS`, `RANKS`, `JOURNEY`, `ARCANA`, `SYMBOLS`). Import data from there, not from the JSON files. `waite.json` is read only by the MCP server.

| File | Holds | Future table |
| --- | --- | --- |
| `cards.json` | All 78, in deck order: id, name, arcana, number (Majors) or suit and rank (Minors), keywords upright and reversed, themes, prompt, `combined` line (Minors), `summary`, `meaning` (upright and reversed), `advice`, `affirmation`, `as_a_person`, `facing`, `symbols` (everything in the picture), tappable `details` with rough x/y regions and their `symbols`. The long written fields are placeholders ("<name> placeholder summary.") except on the Moon, Seven of Wands and Queen of Cups. `facing` is read off the 1909 art for all 78: where the main figure looks from the viewer's side (`left`, `right`, `forward`, or `away` when its back is to you), null with no figure or no single main one. `pose` is what that figure's body is doing (standing, seated, walking, riding, kneeling, lying, falling, upside-down, dancing, flying); several figures sharing a pose count, like the Tower's two falling. Both are filters on `find_cards` | `cards`, `card_details` |
| `symbols.json` | What appears in card pictures (pillars, dog, water): id, name, summary. Cards point to these by id | `symbols`, `card_symbols` |
| `ranks.json` | Ace to Ten, then Page, Knight, Queen, King (11 to 14): name, plural, summary, prompt, the Major it echoes (none for courts) | `ranks` |
| `journey.json` | Pollack's rows 0 to 3: summary, prompt, member cards | `journey_rows` |
| `arcana.json` | Major and Minor Arcana descriptions | `arcana` |
| `spreads.json` | Spreads with ordered positions (id, name, prompt) and a `level` for unlocking | `spreads`, `spread_positions` |

Saved data already matches the planned Supabase shape:

```
readings        id, spread_id, created_at
reading_cards   reading_id, position, position_id, card_id, reversed
entries         id, reading_id, type, body, created_at, updated_at
profile         mode (becomes a profiles row per user)
```

`entries.type` is `interpretation` today. Later types: `reflection` (follow-ups) and `coach` (LLM replies).

## Architecture decisions

- **One storage boundary.** The app only calls the async `store` functions: `saveReading`, `updateInterpretation`, `listReadings`, `getReading`, `getProfile`, `updateProfile`. Moving to the FastAPI backend means rewriting their insides only. Keep this boundary in the React app (`src/lib/store.ts`).
- **Deck vs. data.** All card data lives in `cards.json`. Which cards are in play is a separate list (`DECK_IDS`). Spreads and themed decks will want the same split.
- **Modes are presets.** `MODES` maps each mode to settings (`panel`, default `sections`). Add behavior by adding settings, not by branching on mode names.
- **Layout is computed.** `placeRow(top, bottom)` fits the chosen cards into a vertical band for each phase (picking, flipping, reading). Cards animate with CSS transforms driven by CSS variables.
- **Mobile first.** Test at about 390×760. Safe-area insets are handled. Light and dark tokens are defined on `:root`.

## Design tokens

- **Colors (light / dark):** bg `#E7EAF3` / `#141A33`, ink `#1F2547` / `#ECE7DA`, muted `#565E85` / `#A9AFCB`, card back `#2E3A74` / `#34418A`, gold `#B8913F` / `#D4AF62`, panel `#F6F7FB` / `#1D2444`, card face `#F7F5EF` / `#E6E1D4`.
- **Type:** Young Serif (Google Fonts) for headings, card faces, and prompts. System sans for body.
- **Motion:** spring easing `cubic-bezier(.34, 1.56, .64, 1)`. Layered shadows on cards.

## Target stack

- **App:** Vite, React, TypeScript, installable PWA (`vite-plugin-pwa`) pinned to the phone home screen. Motion (formerly Framer Motion) for springs; canvas for particles later.
- **Backend:** one Python FastAPI app, shaped like speak_friend: REST endpoints for the React app, the MCP server at `/mcp`, and the LLM coach, all behind one shared token check. Every LLM call happens here (no API keys in the client). SQLAlchemy for the database, like speak_friend.
- **Database:** Supabase, used only as free hosted Postgres (the same database type as the country dashboard). Not its login, and the React app never talks to it directly: React, then FastAPI, then Supabase. pgvector later for "you've written about this before."
- **Login:** Auth0, like speak_friend. Rows are filtered in app code, the way the country dashboard and speak_friend do it.
- **Hosting:** Netlify for the app. The remote MCP server goes where speak_friend runs (Azure App Service), to practice the same setup.
- **LLM:** Claude API. Small model for prompts, stronger model for coaching. Prompt caching on the static part (system prompt plus card meanings), streaming, structured output, and token and cost logging per call.
- **MCP:** Python, `mcp==2.3.0` and pydantic, matching speak_friend and daedalus at work (`mcp-server/`). The TypeScript version is kept in `mcp-server-ts/` for comparison. Use what work uses wherever possible. Tools like `draw_cards`, `get_card`, `list_spreads`, `save_reading`, `get_reading_history`. Run locally in Claude Desktop first, then remote with OAuth.

## Next steps

1. **Set up the Vite project.** Done: git repo, Vite with React + TypeScript, JSON in `src/data/` with types. Left: Netlify deploy.
2. **Port the prototype in pieces,** in this order, keeping behavior the same: data and types (done), `store`, deck logic (shuffle, reversals), the fan and flip, spreads and layout, the reading panel, Learn more, card sheet and guide, saving and journal, modes. Check each piece on a phone before moving on.
3. **Make it a PWA** and install it on the phone.
4. **Backend and database.** Grow `mcp-server/` into the FastAPI app (REST plus `/mcp`). Supabase Postgres: seed reference tables from the JSON, create readings, reading_cards, entries, and profiles. Auth0 login. Then swap the `store` internals to call the FastAPI endpoints. Access follows `ACCESS.md`.
5. **MCP server** tools over the same data (started early: `get_card` exists), with pytest tests per tool and per persona.
6. **LLM coach** in the FastAPI app, through the Anthropic SDK with prompt caching and token logging, like daedalus: the person writes first, then the coach responds to their interpretation with curiosity, never prediction or diagnosis.
7. **Imagination triggers** once real art exists: tap the details (using the `details` regions), step into the card (parallax and particles), talk to the figure.

## Ideas from the Dark Forest guide

From the guidebook (ideas only, see Content and copyright). Each is tagged with the step it belongs to.

- **Card entry fields** (data shape). Have: name, keywords, details, prompt. New: element, astrology and number meaning for Majors; a one-line summary; upright and reversed paragraphs; what each detail's symbol means (`symbols.json`); an affirmation; one line of advice; "as a person" (court cards); optional love and work lines. Skip "timing" and "leans yes": they predict.
- **Which way figures face** (data shape). A figure facing the next card is moving toward it. A `facing` field (left, right, forward).
- **Count what came up** (MCP tools). Mostly one suit shows where the story is; several Majors mean big themes. `draw_cards` can return the counts, computed by code, not guessed by Claude.
- **Ask open questions** (MCP prompt). "Will I get the job?" becomes "What do I need to know going into this?" `daily_draw` can offer an open version of a yes/no question before drawing.
- **Ask once** (MCP prompt, app). Reshuffling for a better answer is anxiety, not a reading. Draw once; think about what "Shuffle again" invites.
- **Reversals optional while learning** (app). Answers the open question below: a reversal setting, off for beginners.
- **The spread ladder** (access). One card, then three, then a five-card cross, then the Celtic Cross. Matches the `level` on each spread, so the levels follow a real teaching path.

## Journal ideas

From the Dark Forest printable journal: ideas and layout only, in our own words and design. For when the Journal level is built.

- **The daily loop.** Morning: ask a question, draw one card, write a first impression before any meaning (Journal mode already hides keywords until you write). Evening: come back and write how it showed up. Then one takeaway.
- **Fits the saved-data shape with no new table.** A `question` on `readings`, and new `entries.type` values: `first-impression`, `showed-up`, `takeaway`. The evening note is an owner-only edit of your own reading (ACCESS.md).
- **Looking back is the skill.** A reading log, a monthly reflection, and a 30-day card-a-day view, all built on `get_reading_history`.
- **Anchor it to a habit** ("after my morning coffee"), and missing a day is fine: no streak guilt.
- **A moon-cycle journal** pairs with the moon-phase circles.
- **Other page ideas:** a three-card spread page, and "the card that confused me" (a card to come back to).

Later ideas: follow-up reflections on old readings, Daily mode, Practice mode (flashcards with spaced repetition), personal card pages built from past entries, weekly reviews, the Celtic Cross.

## Open questions

- **Reversals on iPhone.** I once saw 9 of 9 cards reversed at the old 50% rate. It could not be reproduced in Chromium. Watch for it in Safari: does the label or the face look wrong?
- **Card art.** The Commons Roses & Lilies scans (see Content and copyright). Still open: how to host 78 images, and how to cut layers for parallax.
- **Celtic Cross.** Needs a bigger deck and a cross-shaped layout.
- **Reversal setting.** Should `REVERSAL_RATE` become a user preference (off for beginners)?
