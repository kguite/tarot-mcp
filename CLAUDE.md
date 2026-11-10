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

## Product principles

- **Reflection, not prediction.** No copy or LLM output that tells someone what will happen. Prompts ask questions; the person interprets.
- **The code draws the cards, never the LLM.** Shuffling and reversals use `crypto.getRandomValues` and Fisher–Yates. An LLM may interpret a draw it is given, never produce one.
- **Small deliberate rituals.** Tap a card to choose it, tap again to turn it over. Keep that two-step reveal.
- **Learn by combining.** A Minor card is suit × number. A Major has a place in Pollack's journey (the Fool, then three rows of seven). Every Major I to X echoes the matching number in the Minors.
- **Quiet by default.** Extra info is opt-in (the Learn more menu, modes), never piled on.
- **Motion with purpose.** Josh Comeau style springs, layered shadows, and small moments of delight (the save sparkles). Always respect `prefers-reduced-motion`.

## Content and copyright

- Do not reproduce text from Pollack's or Dore's books, or any copyrighted tarot book. Write original content in our own words.
- Public domain sources we can use: the 1909 Rider-Waite-Smith card art and A.E. Waite's *The Pictorial Key to the Tarot* (1910).
- The current card faces are placeholders (numeral, symbol, name) until real art is added.

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

The deck in play is 10 cards: The Fool, The Magician, The High Priestess, The Hermit, The Star, The Moon, Seven of Wands, Three of Cups, Five of Swords, Ace of Pentacles. Seven more Majors (Empress through Wheel of Fortune) exist in the data as lookup-only cards so every "echo" link resolves.

## Data

JSON files in `tarot-app/src/data/`, normalized so cards point to shared reference data instead of repeating it. `types.ts` has a type for each file, and `index.ts` exports each one typed (`CARDS`, `SPREADS`, `SUITS`, `RANKS`, `JOURNEY`, `ARCANA`). Import data from there, not from the JSON files.

| File | Holds | Future table |
| --- | --- | --- |
| `cards.json` | Every card: id, name, arcana, number (Majors) or suit and rank (Minors), keywords upright and reversed, themes, prompt, `combined` line (Minors), tappable `details` with rough x/y regions | `cards`, `card_details` |
| `suits.json` | Element, playing-card suit, summary, prompt | `suits` |
| `ranks.json` | Ace to Ten: name, plural, summary, prompt, the Major it echoes | `ranks` |
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

- **One storage boundary.** The app only calls the async `store` functions: `saveReading`, `updateInterpretation`, `listReadings`, `getReading`, `getProfile`, `updateProfile`. Moving to Supabase means rewriting their insides only. Keep this boundary in the React app (`src/lib/store.ts`).
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
- **Backend:** Supabase: Postgres with RLS from day one, Google and Apple OAuth, Edge Functions for every LLM call (no API keys in the client), pgvector for "you've written about this before."
- **Hosting:** Netlify, for the app and later a remote MCP server.
- **LLM:** Claude API. Small model for prompts, stronger model for coaching. Prompt caching on the static part (system prompt plus card meanings), streaming, structured output, and token and cost logging per call.
- **MCP:** TypeScript MCP SDK. Tools like `draw_cards`, `get_card`, `get_spread`, `save_reading`, `get_reading_history`. Run locally in Claude Desktop first, then remote with OAuth.

## Next steps

1. **Set up the Vite project.** Done: git repo, Vite with React + TypeScript, JSON in `src/data/` with types. Left: Netlify deploy.
2. **Port the prototype in pieces,** in this order, keeping behavior the same: data and types (done), `store`, deck logic (shuffle, reversals), the fan and flip, spreads and layout, the reading panel, Learn more, card sheet and guide, saving and journal, modes. Check each piece on a phone before moving on.
3. **Make it a PWA** and install it on the phone.
4. **Supabase.** Seed reference tables from the JSON, create readings, reading_cards, entries, and profiles with RLS, add OAuth, then swap the `store` internals.
5. **MCP server** over the Supabase data, tested in Claude Desktop.
6. **LLM coach** in an Edge Function: the person writes first, then the coach responds to their interpretation with curiosity, never prediction or diagnosis.
7. **Imagination triggers** once real art exists: tap the details (using the `details` regions), step into the card (parallax and particles), talk to the figure.

Later ideas: follow-up reflections on old readings, Daily mode, Practice mode (flashcards with spaced repetition), personal card pages built from past entries, weekly reviews, the Celtic Cross.

## Open questions

- **Reversals on iPhone.** I once saw 9 of 9 cards reversed at the old 50% rate. It could not be reproduced in Chromium. Watch for it in Safari: does the label or the face look wrong?
- **Card art.** Which public domain scans to use, and how to cut layers for parallax.
- **Celtic Cross.** Needs a bigger deck and a cross-shaped layout.
- **Reversal setting.** Should `REVERSAL_RATE` become a user preference (off for beginners)?
