# Steps

A log of how this project was built, one step at a time, with the why behind each choice.
Commands are for cmd on Windows.

## 1. Git and GitHub

**What:** a local git repo in `codebases\tarot-mcp`, connected to a private GitHub repo,
`katie-guite/tarot-mcp`.

The usual commands for this:

```
cd C:\Users\KatieGuite\Documents\codebases\tarot-mcp
git init
git remote add origin https://github.com/katie-guite/tarot-mcp.git
git add .
git commit -m "Add tarot app prototype and data"
git push -u origin main
```

**Layout:** the repo root holds `CLAUDE.md` and this file. The app lives in `tarot-app/`. Later
projects (the MCP server, Supabase migrations) get their own folders beside it, so the root
doesn't fill up with one project's files.

**Fixing a typo in the repo name.** The repo started out as `tarot-mpc`.
- Rename it on GitHub under Settings. GitHub forwards the old address to the new one, but
  don't rely on that.
- Point the local repo at the new address:
  `git remote set-url origin https://github.com/katie-guite/tarot-mcp.git`
- Check it: `git remote -v`
- Rename the local folder too. Close VS Code first, because Windows won't rename a folder
  that's open.

**Getting out of Vim.** `git commit` without `-m` opens Vim to ask for a message.
1. Press `Esc`, then `gg` to jump to the top line.
2. Press capital `O` to open a new line above it, then type the message.
   (Lowercase `i` would type onto the `#` comment line, which git ignores.)
3. Press `Esc`, type `:wq`, and press Enter to save and commit.
   To cancel instead: `Esc`, then `:q!`, then Enter.

To skip Vim next time, use `git commit -m "message"`, or make VS Code git's editor:
`git config --global core.editor "code --wait"`

**Branches.** Each change gets a branch and a PR. `main` holds only finished work.

```
git switch -c vite-setup
```

## 2. Vite + React + TypeScript

**What:** a starter app in `tarot-app/`, built from Vite's `react-ts` template.

**Why Vite:** it serves the app instantly while you work and reloads the page when a file is
saved. `npm run build` bundles it into plain files any host can serve.

**The catch:** `tarot-app/` already held `data/` and `prototype/`. The scaffolder's
`--overwrite` option deletes everything in a folder that isn't empty, so don't use it here.
Instead, create the template in an empty folder, check it, then copy it in:

```
cd %TEMP%
npm create vite@latest tarot-app -- --template react-ts --no-interactive --no-immediate
```

Check the generated files for names that clash with existing ones, then copy them all into
`tarot-mcp\tarot-app`, including the hidden `.gitignore` and `.oxlintrc.json`.

Then install the packages and check that it builds:

```
cd C:\Users\KatieGuite\Documents\codebases\tarot-mcp\tarot-app
npm install
npm run build
```

**What the template added:**

| File | Does |
| --- | --- |
| `package.json` | Lists the packages and the scripts: `dev`, `build`, `lint`, `preview` |
| `package-lock.json` | Pins the exact version of every package, so every install matches. Commit it. |
| `index.html` | The one page. Loads `src/main.tsx`. |
| `src/main.tsx` | Mounts the `App` component into the page |
| `src/App.tsx`, `App.css`, `index.css` | The demo counter page, to be replaced |
| `vite.config.ts` | Vite settings. For now, only the React plugin. |
| `tsconfig*.json` | TypeScript settings: one for the app code, one for config files like `vite.config.ts` |
| `.oxlintrc.json` | Settings for Oxlint, the linter (`npm run lint`) |
| `.gitignore` | Leaves out `node_modules` (installed packages) and `dist` (build output) |

**Run it:**

```
npm run dev
```

Open the address it prints, usually http://localhost:5173. To try it on a phone on the same
Wi-Fi, run `npm run dev -- --host` and open the Network address.

**Versions used:** Node 22.21.1, npm 10.9.4, create-vite 9.3.4, Vite 8.3.7, React 19,
TypeScript 7.

## 3. Clear the template and type the data

**Clear the demo.** Delete `src/assets/` (the Vite and React logos and the hero image),
`src/App.css`, and `public/` (the favicon and icons). Remove the favicon line from
`index.html`. The app gets its real icon when it becomes a PWA. Replace the template's
`README.md` with a short one: what the app is, the commands, and where things live.

`App.tsx` becomes a single heading plus a line that counts the loaded cards and spreads. It's a
quick check that the data imports work. `index.css` now holds the prototype's color tokens,
light and dark.

**Move the data.** Move the JSON files from `tarot-app/data/` to `tarot-app/src/data/`. Vite
only processes files under `src/` that something imports, so this is where data the app
uses belongs.

**Types.** `src/data/types.ts` describes the shape of each file:

| Type | File |
| --- | --- |
| `Card` (`MajorCard` or `MinorCard`), `CardDetail`, `Keywords` | `cards.json` |
| `Suit` | `suits.json` |
| `Rank` | `ranks.json` |
| `JourneyRow` | `journey.json` |
| `ArcanaInfo` | `arcana.json` |
| `Spread`, `SpreadPosition` | `spreads.json` |

`Card` is a **union**: either a `MajorCard` (has `number`) or a `MinorCard` (has `suit`,
`rank`, `combined`). The `arcana` field tells them apart. Inside
`if (card.arcana === 'minor')`, TypeScript knows the card has a `suit`. Outside it,
`card.suit` is an error. That catches the "this card has no suit" mistakes at build time
instead of on the phone.

**One import point.** `src/data/index.ts` imports each JSON file and exports it with its type:
`CARDS`, `SPREADS`, `SUITS`, `RANKS`, `JOURNEY`, `ARCANA`. The rest of the app imports from
`./data`, never from the JSON files directly.

Why the `as Card[]` cast: TypeScript reads `"arcana": "major"` in a JSON file as any string,
not the exact value `'major'`, so the JSON doesn't match `Card` on its own. The cast says
"trust me, it does." That trust is the weak spot: if the JSON drifts from the types, nothing
complains. It's acceptable here because the JSON is hand-written and moves to Supabase later.

**Check:**

```
npm run build
npm run lint
npm run dev
```

The page should say "17 cards and 5 spreads loaded."

## 4. An MCP server with one tool

**What:** `mcp-server/`, a small Python program with one tool, `get_card`, that reads
`tarot-app/src/data/cards.json`. It's a separate project from the app, with its own
`requirements.txt` and `.venv`.

**Why Python, when the app is TypeScript:** to use what work uses. speak_friend is a Python MCP
server on the same package (`mcp==2.3.0`), and daedalus defines tools with pydantic. Everything
learned here carries over line for line. The app and the server share only the JSON files.

**How MCP works.** Think of the server as a kitchen, and Claude as a waiter who can only read
the menu.
- **The menu** is the tool list: each tool's name, description, and inputs. That's all Claude
  sees. It never sees the code.
- **The order:** Claude picks a tool that fits the question and calls it with arguments.
- **The kitchen** is the function that runs and sends back a result. Claude writes its answer
  from that result.
- **A bad menu gets bad orders.** A vague description means the wrong tool or the wrong
  arguments, even when the code is fine.

**The client** (Claude Desktop, Claude Code, or the Inspector) starts the server as a background
program and talks to it over stdin and stdout, one JSON message per line. This is the
**stdio transport**. There are three messages:

| Message | Means |
| --- | --- |
| `initialize` | Handshake: protocol version, and what each side supports |
| `tools/list` | "Show me the menu." The server answers with each tool's name, description, and input schema. |
| `tools/call` | "Run `get_card` with `{ "id": "moon" }`." The server answers with `content`. |

**Gotcha:** stdout *is* the conversation, so `print()` in the server corrupts it. Log to
stderr instead.

**Setup:**

```
git switch main
git pull
git switch -c mcp-server
mkdir mcp-server
cd mcp-server
C:\Users\KatieGuite\anaconda3\envs\dev310\python.exe -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

- `requirements.txt` pins `mcp==2.3.0`, the same as speak_friend. It brings pydantic with it.
- `.venv` is this project's own Python, made from dev310, the way speak_friend's README does it.
  `.gitignore` leaves it out.

**The code,** `server.py`, has three parts:
1. Read `cards.json` once at startup. The path is built from `__file__`, so it's relative to
   the file, not to the folder the server is started from.
2. `mcp = MCPServer(name='tarot')`
3. A plain Python function with `@mcp.tool()` on top. The SDK builds the menu from it:
   - the function name is the tool name
   - the docstring is the description
   - each argument becomes an input, and `Annotated[str, Field(description=...)]` (pydantic)
     gives it a description on the menu
   - the return value is the result

If the id doesn't exist, the function raises `ToolError` with the list of valid ids. The SDK
turns that into a result with `isError: true`. Claude reads it and can retry with the right
id, so a good error message is part of the menu too.

**Check it raw.** Send it the messages directly (Git Bash):

```
printf '%s\n' \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}' \
'{"jsonrpc":"2.0","method":"notifications/initialized"}' \
'{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_card","arguments":{"id":"moon"}}}' \
'{"jsonrpc":"2.0","id":4,"method":"tools/list"}' \
| .venv/Scripts/python.exe server.py
```

The answer to `tools/list` is exactly what Claude would see: the function's signature has
become JSON Schema. The last request is a spare: the pipe closes as soon as the input ends,
and the server can be cut off before its last reply.

**Lesson: the result was being sent twice.** With `-> str` on the function, the SDK guesses
you want "structured output" and sends the result twice: once as `content` and again as
`structuredContent`, plus an `outputSchema` on the menu. `@mcp.tool(structured_output=False)`
turns that off. The card reply dropped to about half its size (1,184 bytes). speak_friend's
`get_demand` has the same `-> str` and plain `@mcp.tool()`, so it is worth checking there.

**Check it in the Inspector** (cmd, from `mcp-server`):

```
npx @modelcontextprotocol/inspector .venv\Scripts\python.exe server.py
```

**What the Inspector is:** Postman for MCP. It plays the client, so you can make requests by
hand and see the exact JSON, with no AI involved. Unlike Postman, it also speaks the protocol
for you: it does the handshake, wraps each request in its envelope (`jsonrpc`, `id`,
`method`, `params`), and matches replies by `id`. You only say which tool and what input.

| REST (speak_friend) | MCP (tarot) |
| --- | --- |
| Postman, or FastAPI's `/docs` page | The MCP Inspector |
| `/openapi.json`: every endpoint and its inputs | `tools/list`: every tool, description, and input schema |
| `GET /get_demand` | `tools/call` with `get_card` and `{"id": "moon"}` |

**Using it** (Inspector 2026 layout):
1. The page shows a `python.exe` card with the command. Flip its toggle to connect. The top bar
   shows the server's name (`tarot`, from `MCPServer(name='tarot')`) and the protocol version
   both sides agreed on (`MCP 2025-11-25`).
2. The Messages panel on the right is the whole conversation, newest first, so read it from the
   bottom: `initialize`, `notifications/initialized`, then the Inspector asks for all three
   menus by itself: `tools/list`, `prompts/list`, `resources/list`. Prompts and resources come
   back empty, since this server only has a tool.
3. Expand `tools/list` (the arrows icon) to see the raw menu.
4. Open the Tools tab, pick `get_card`, enter `moon`, and run it. A `tools/call` message
   appears at the top of the panel. Try `the-moon` to see the error.

The long `MCP_INSPECTOR_API_TOKEN` in the address bar is a password for that session. Keep it
out of screenshots you share.

**Claude Desktop: skipped for now.** A stdio server is added to Claude Desktop through a config
file, normally reached from Settings, then Developer. This version of Claude Desktop
(3.6556.1) has no Developer menu, only Customize (Connectors, Skills, Plugins). So the plan is
the remote route instead: once the server speaks HTTP, add its URL with "+ Add" under
Connectors. That's also how speak_friend is reached, so it's the more useful one to learn.

**No API tokens needed.** The server makes no AI calls, and Claude Desktop runs on the
claude.ai account. API tokens come later, when the app calls Claude itself.

**At work: daedalus does all of this in one process.** MCP splits three jobs that daedalus
(`src/ai/anthropic_model.py`) does itself:

| Job | With MCP | In daedalus |
| --- | --- | --- |
| The app you chat in | Claude Desktop | `run_streamlit_app` |
| The loop: ask Claude, run tools, repeat | Built into Claude Desktop | `_run_tool_loop` |
| The menu | The server's `tools/list` reply | `_build_anthropic_tools`: function name, description, pydantic schema |
| The kitchen | The server's tool handler | The app's Python function, called by `_dispatch_tool` |

So daedalus uses plain tool use through the Anthropic SDK, with no MCP. The menu is built the
same way: a name, a description, and a pydantic schema.

**The same server in TypeScript** is kept in `mcp-server-ts/` (the TypeScript MCP SDK, with zod
in place of pydantic). It was built first, then replaced to match work. Comparing the two shows
what is the protocol and what is just one SDK's style: the messages are identical, and only the
way you declare a tool differs.
daedalus also prompt-caches the system prompt and messages and logs tokens per turn, which is
the pattern to copy when tarot calls Claude itself.

## 5. Test the tool with pytest

The Inspector is checking by hand. A test checks the same thing every time, in under a second.

**Setup.** pytest goes in `requirements.txt` (pinned to `9.1.1`, the same as speak_friend), then:

```
cd mcp-server
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m pytest tests -q
```

Run it from `mcp-server/` with `python -m pytest`, not plain `pytest`. `python -m` puts the
current folder on the import path, so the test can `import server`. speak_friend runs its tests
the same way. pytest leaves a `.pytest_cache` folder behind, so it's in `.gitignore`.

**The trick: test through MCP, not around it.** The SDK's `Client` usually takes a URL or a
command. In tests it can take the server object itself and run it in-process:

```python
async with Client(mcp) as client:
    result = await client.call_tool('get_card', {'id': 'moon'})
```

That's the same `tools/list` and `tools/call` Claude sends, with no subprocess and no Inspector.
Calling `get_card('moon')` directly would test the kitchen but not the menu or the reply shape.

**The three tests** (`mcp-server/tests/test_server.py`):

| Test | Checks |
| --- | --- |
| The menu | `tools/list` has `get_card`, its description, and `id` as a required input |
| A good call | `moon` comes back once, as text, and its name is The Moon |
| A bad call | `the-moon` comes back with `is_error` set, and the text lists the valid ids |

"Once" is the test for the "result sent twice" lesson in step 4. Without
`structured_output=False` the reply still has one content block but gains a `structuredContent`
copy, so the test checks `structured_content` is empty, not just the block count. To see it
bite, delete `structured_output=False` from `server.py`, rerun, watch that test fail, and put it
back.

**Field names in Python are snake_case.** The wire says `isError` and `inputSchema`; the SDK's
Python objects say `is_error` and `input_schema`.

**At work.**

| | tarot | speak_friend | demand_scenarios |
| --- | --- | --- | --- |
| Test file | `mcp-server/tests/test_server.py` | `tests/test_mcp.py` | `tests/` |
| What it tests | The tool, through MCP | The token check only, no tool call | The tool wrappers |
| How it stays offline | `Client(mcp)` in-process | A fake Auth0 key (`tests/fake_auth0.py`) | The HTTP client is replaced |
| Run | `python -m pytest tests -q` | `python -m pytest` | `python -m pytest tests -q` |

speak_friend has no test that calls `get_demand` through MCP. This pattern would be the one to
add there.

## 6. Two more tools: list_spreads and draw_cards

One tool gives Claude nothing to choose. With three, "do a past, present, future reading" means
Claude reads the menu, calls `list_spreads` if it needs the id, then calls `draw_cards`.

**list_spreads** takes no input and returns each spread's id, name, summary and position names.
It was planned as `get_spread(id)`, but Claude's first question is "which spreads are there", and
the positions come back with the draw anyway.

**draw_cards(spread_id)** works like a reading at a table:

1. Find the spread in `spreads.json`. Its `positions` list is the spots, in order (Past, Present,
   Future). It says how many cards and what each spot means, not how they're laid out. Layout is
   the app's job.
2. Deal: `rng.sample(CARDS, len(positions))` picks that many different cards, like dealing from
   a real deck. No card comes up twice.
3. Pair them: `zip(positions, cards)` joins them like a zipper, one pair at a time. Past gets the
   first card, Present the second.
4. Flip a weighted coin per card: `rng.random()` is a number from 0 to 1, and under 0.25 means
   reversed. About 1 card in 4, matching the prototype.
5. Send back each position, its question, the card, reversed or not, and only the keywords for
   that side.

`rng` is `random.SystemRandom()`, which asks the operating system for random numbers, like
`crypto.getRandomValues` in the prototype.

**The code draws the cards, never the model.** A model is bad at being random and might pick
cards that fit the question. Claude asks for a draw and reads what came up.

**Testing something random.** You can't check which cards come up, only what's always true:

| Test | Checks |
| --- | --- |
| list_spreads | The spreads come back in order, with their positions |
| A full draw | A Celtic Cross has 10 cards, in position order, all different |
| A reversed draw | With the random number pinned to 0, the card is reversed and has the reversed keywords |
| A bad spread id | `three-card` is an error that lists the valid ids |

Pinning uses pytest's `monkeypatch`: for one test, `rng.random` is swapped for a function that
always returns 0. That gives a repeatable draw without adding a seed input to the tool, which
Claude would see on the menu and might start filling in.

**At work.** demand_scenarios has the same rule as "the code draws": every number comes from
`lb_database_api`, and the model never computes one. If you find yourself computing a figure in
the chat app, you're in the wrong repo. Here, if the model is picking cards, the tool is missing.

## 7. A prompt and a resource: who decides

An MCP server can offer three kinds of things. The difference is who decides to use each one.

| | Who decides | Restaurant | Ours |
| --- | --- | --- | --- |
| Tool | Claude | A dish Claude orders | `get_card`, `list_spreads`, `draw_cards` |
| Resource | You or the app | Reading material on the table | `tarot://waite/{id}` |
| Prompt | You | The set menu | `daily_draw` |

The same data can go through any of the three. A list of journal questions could be a resource
you attach, a tool Claude calls mid-reading, or a prompt you start. Pick by who should decide.

**The prompt: daily_draw.** `@mcp.prompt()` on a function that returns a string. The string
becomes a message to Claude, with your question filled in: draw one card, say only its name,
ask for your first impression, wait, then talk starting from what you wrote. Step 3 is why it's
a prompt. A tool can only hand back data; it can't make Claude wait. "Hold back the meaning" is
an instruction, and a prompt is how a server gives Claude instructions you chose. It came from a
journal's morning loop: first impression before the meaning.

In the Inspector: the Prompts tab, pick `daily_draw`, type a question, and see the message.
The Inspector shows the message, not the conversation. Seeing Claude wait needs Claude Desktop.

**The resource: Waite's own words.** `waite.json` holds Waite's *Pictorial Key to the Tarot* for
our 17 cards, copied exactly from Wikisource (public domain, credited with a link): what the
picture shows, then upright and reversed. `@mcp.resource('tarot://waite/{id}')` serves one card.

- **`{id}` makes it a template:** one recipe for 17 resources. It's listed under resource
  templates, not resources, and the client fills in the id (`tarot://waite/moon`).
- **A resource error goes to the app, not Claude.** `get_card` with a bad id returns an error
  Claude reads and can fix. `tarot://waite/the-moon` raises a protocol error the client app has
  to handle. That fits: you picked it, so you get the error.
- **Waite is source material, not the app's voice.** His meanings are often bleak or dated
  ("hidden enemies"). The app writes its own. His picture descriptions are useful as the list
  of what is on each card, for `symbols.json`.

**Getting the text.** Claude's web reader summarizes long pages instead of quoting them, so the
two Wikisource pages came through Wikipedia's public API as HTML, and a scratch script pulled
the text out. The only change is rejoining sentences split at the book's page breaks.

**Testing.** Same `Client(mcp)` pattern: `list_prompts`, `get_prompt`, `list_resource_templates`,
`read_resource`. One gotcha: the bad-id resource test catches the error inside `async with
Client(...)`. If it escapes, it comes out wrapped in an `ExceptionGroup` and `pytest.raises`
misses it.

**At work.** speak_friend only has a tool, which fits: Claude decides when it needs demand
numbers. A resource would suit fixed reference material someone attaches on purpose, like a
glossary. A prompt would suit a check that should always run the same way, like a monthly demand
review. Prompts are the closest MCP gets to Skills: a saved recipe you start on purpose.

## 8. The data shape, then all 78 cards

Branch `data-shape`. The goal: settle what a card looks like on a few cards, then fill the deck
once, in the final shape.

**Symbols link the cards.** "Other cards with pillars" was impossible: each card's details had
made-up ids, so nothing said the High Priestess's pillars and the Hierophant's were the same
thing. Now `symbols.json` lists what appears in card pictures (64 so far: pillars, dog, water,
blindfold...), and cards point to them by id. Two levels:

| Field | Holds | Used for |
| --- | --- | --- |
| `card.symbols` | Everything in the picture | `find_cards` |
| `detail.symbols` | What one tappable spot shows ("the dog and the wolf" is two) | The app's tap targets |

The symbol lists come from Waite's own descriptions of the 1909 pictures (Part 2 for Majors,
Part 3 for Minors; his Part 1 describes older decks, so it was skipped), plus a look at the art
where his text is thin. Some links that fell out: pillars on the High Priestess, Hierophant,
Justice and Death; a blindfold on the Two and Eight of Swords; scales on Justice and the Six of
Pentacles.

**find_cards.** Filters by `symbol`, `suit` and `rank`, and they combine. With a symbol, the reply
includes its summary. This is "push filtering into the API": Claude asks for the pillars cards and
gets four, instead of reading 78 and maybe missing one. `suit` is a `Literal` of the four suits,
so the allowed values are on the menu before Claude calls.

**Shape first, on three cards.** The Moon (a Major with no person), the Seven of Wands (a numbered
Minor) and the Queen of Cups (a new court card) got every new field: `summary`, `meaning` (upright
and reversed paragraphs), `advice`, `affirmation`, `as_a_person`, and `facing`. Court ranks 11 to
14 were added to `ranks.json`. Then the other cards got real keywords, themes, prompts and symbols,
and placeholders ("Two of Wands placeholder summary.") in the long fields, so the whole shape works
now and the wording can come later. `facing` is read off the art, so it stays null until checked.

**Tests that check the data, not the code.** Symbol ids are typed by hand, so a test checks that
every id a card uses exists, every detail's symbols are on its card, and every symbol is used.
Others check there are 78 cards with every field, and that each card has Waite's text. A typo like
`pilars` would otherwise just quietly drop a card from every search.

**Scripts for bulk edits.** Adding fields to 78 cards by hand is 78 chances to slip, so small
scripts in the session scratchpad did it, keeping the files' formatting and key order. The
scripts are throwaway; the data and its tests are what's kept.

**At work.** The demand lookup in demand_scenarios takes `group_by`, `columns` and `filters` so the
API does the filtering, the same idea as `find_cards`. And "test the data" is the habit behind
checking a figure against the database: the code can be right and the data still wrong.

## 9. Facing and pose, read off the art

Two facts about each card's main figure, taken from the 1909 Roses & Lilies scans on Wikimedia
Commons (downloaded to a scratch folder and tiled 8 to a sheet to look through quickly):

- **facing:** where the figure looks, from your side of the card: `left`, `right`, `forward`, or
  `away` when its back is turned (six cards, like the Eight of Cups). null with no figure.
- **pose:** what its body is doing: standing, seated, walking, riding, kneeling, lying, falling,
  upside-down, dancing, flying. Several figures sharing a pose count: the Tower's two are falling.

Both are filters on `find_cards`. "Cards where someone's back is turned, in Cups" is one request.

`away` was added partway through, when six cards didn't fit left, right or forward. That's the
point of trying a shape on real data: the data tells you what's missing. A few facing calls are
judgment calls (the Seven of Swords walks right but looks back left) and can change later.

The allowed values live once in `server.py` (`Facing`, `Pose`) and the data test reads them from
there with `get_args`, so the test and the tool can't disagree. `types.ts` has a copy for the app.

## 10. One FastAPI app: REST plus MCP

`mcp-server/main.py` is one FastAPI app, shaped like speak_friend's `main.py`:

| Address | What |
| --- | --- |
| `GET /cards/{id}` | One card |
| `GET /cards?symbol=&suit=&rank=&facing=&pose=` | Search, same as `find_cards` |
| `GET /spreads` | The spreads |
| `POST /spreads/{id}/draw` | A new random draw |
| `/mcp` | The MCP server, for Claude |

**REST and MCP call the same functions.** The tool decorator hands back the plain function, so
`read_card` just calls `get_card`. The app and Claude always get the same answer, and a fix in one
place fixes both. speak_friend does the same with `get_demand_data`.

**A tool error becomes an HTTP status.** `ToolError` turns into 404 (unknown card or spread) or 400
(bad search), with the same helpful message Claude gets. FastAPI rejects a bad `suit` with 422
before any of our code runs, because `suit` is the same `Suit` Literal the tool uses.

**Draw is POST, not GET.** GET means "read this", and browsers and caches may repeat or reuse it.
Every draw is new and random, so it must never be cached.

**The MCP part,** copied from speak_friend:

- `app.mount('/', mcp.streamable_http_app(...))`, mounted last so the REST routes win.
- `stateless_http=True, json_response=True`: each request stands alone with a plain JSON reply.
  Simplest, and safe when several copies of the app run.
- A `lifespan` that runs `mcp.session_manager.run()` while the app is up.
- `TransportSecuritySettings`: MCP only answers requests addressed to its own host
  (`MCP_SERVER_URL`, default `http://127.0.0.1:8000/mcp`). Deployed, that env var is the public URL.

**Run it** from `mcp-server/`:

```
.venv\Scripts\python.exe main.py
```

Then open `http://127.0.0.1:8000/docs`: FastAPI builds a "try it" page from the code, the REST
version of the Inspector. The Inspector itself can connect to `http://127.0.0.1:8000/mcp` with the
Streamable HTTP transport instead of starting `server.py`.

**Testing.** `tests/test_main.py` uses FastAPI's `TestClient`, which talks to the app in memory
(it needs `httpx`). Its `base_url` is `http://127.0.0.1:8000` so the MCP host check passes. Six
tests: a card, a 404, a search, a 422, a draw, and the MCP handshake over HTTP.

**Not yet:** no login (that's ACCESS.md), and no public URL. As far as I know, a claude.ai or
Claude Desktop "+ Add" connector is reached from Anthropic's servers, not your laptop, so
`127.0.0.1` won't work there; it needs a deploy or a tunnel. Not tested yet.

**Cleanup pass.** After it worked, a read-through for fluff found:

- `get_card`'s description still listed the fields from three steps ago. The description is what
  Claude reads, so a stale one is a real bug. Now it lists what it actually returns.
- "Find by id" was written four ways. Now one `by_id(items, id)` helper.
- A long `if a is None and b is None and ...` became `if all(v is None for v in (...))`.
- Seven copies of the same async block in the tests became one `ask(lambda client: ...)` helper.
- `/spreads` had error handling for an error that can't happen. Removed.

Worth doing after every step that works: make it run, then make it plain.

## 11. Design: tokens and shared components

**Explore first, then build.** Three directions in navy and gold went on a design canvas as phone
screens, each the same reading screen with real 1909 art, so only the look differed: Night sky,
Paper and ink, Gilded frame. Gilded won. A second board pinned down its tokens and every piece of
the screen before any React was written. Choosing on a picture is cheap; restyling components is
not.

**Tokens:** `src/styles/tokens.css` holds every color, font, space, corner and the one shadow as CSS
variables (`--gold`, `--font-display`, `--space-4`...). Components use only the variables, so the
whole app changes from one file. It's the same idea as `server.py`'s `Facing` and `Pose`: one place
for each decision.

**Components:** `src/components/`, each a `.tsx` and a `.module.css`. A CSS Module makes class names
private to its file (Vite turns `.label` into something like `_label_x1y2`), so two components can
both say `.label` without clashing. Vite supports them with nothing to install.

| Component | Notes |
| --- | --- |
| `Card` | `state` is `down`, `resting` or `chosen`. Face down takes no card; face up must have one, and TypeScript enforces it (a discriminated union). `reversed` turns the face over. The face is a placeholder (numeral and name) until the art is hosted |
| `Button`, `IconButton` | Real `<button>`s. `IconButton` requires a `label`, or a screen reader says only "button" |
| `ReadingPanel` | Name, upright or reversed, summary, keywords for that side, the position's question |
| `TextField` | The label wraps the box, so tapping the label focuses it |
| `Ornament`, `Eyebrow`, `Keywords`, `Star` | The small pieces the others reuse |

`App.tsx` is a temporary gallery: the reading screen built from these, then each card state. Run
`npm run dev` in `tarot-app/` to see it.

**At work.** country-dashboard has the same problem at a bigger size: many screens that should
look like one app. Tokens plus a small set of shared components is how that stays true, and the
shared-components work with Tahmina is the work version of this step.

## 12. The art, and a card up close

**The art.** All 78 scans of the 1909 Roses & Lilies deck went into `tarot-app/public/cards` as WebP
(19.4 MB). Vite serves `public/` as-is, so the Moon is `/cards/moon.webp`; `artUrl(id)` in
`src/data` builds the path. A script asked Commons for every file's license before downloading
and would have stopped on anything not public domain; `public/cards/CREDITS.md` lists the result.

Wikimedia rate-limits fast downloads (HTTP 429). The fix was patience, not cleverness: skip files
already saved, wait between files, and back off longer after each 429. Its cached thumbnail service
is far less limited than the original files.

**Check data against the real thing.** The 32 tappable details had positions guessed before there
was art. Drawing them on each image with a 10% grid showed most were off: the Hermit's "staff"
ring sat on his robe, the Five of Swords' "figures walking away" was on the main figure. All 32
were re-placed and drawn again to confirm. Same lesson as testing the data: the code was fine, the
numbers were wrong.

**CardInspect.** Tap a card in the gallery to open it:

- A native `<dialog>` opened with `showModal()`. The browser gives the focus trap, Escape to
  close and the dimmed backdrop, with no library.
- Gold rings on the details, placed in percent on the same box as the image, so they stay on the
  art when it zooms or turns over. Tap one for its question; "Write from this" adds it to the
  reflection, like the prototype.
- Zoom: the button, or a double-click, makes the art 200% wide inside a box that scrolls, so you
  pan by scrolling or dragging. Pinch-to-zoom is left for later.
- "In this picture": the card's symbols as chips, lit gold when they belong to the tapped detail.
  Tap one for the SymbolSheet: its meaning, its `across` line, and the other cards it is on, which
  open in turn.
- The parent passes `key={card.id}`, so opening another card starts fresh instead of carrying the
  old selection over. That's React's way to say "this is a different thing now".

Not yet checked in a real browser or on a phone, only built; double-tap on phones in particular.

## Next

- Try CardInspect on a phone; then the draw screen: the fan, pick, and flip with the spring
- More details per card as we notice them, aiming for about 6 each, placed on the art with the
  grid: the High Priestess's throne and pillars, the Five of Swords' wind and beach, the Moon's two
  towers. New ones may need new symbols (wind, beach)
- Trim `get_card`'s reply: measure it, cut what Claude doesn't need, measure again
- Deploy or tunnel the FastAPI app, then add its URL in Claude Desktop with "+ Add" and watch
  Claude choose between the tools
- Explore the data through the tools and adjust the shape; write the placeholder fields
- Access: levels, permissions and circles, in the build order in `ACCESS.md`
- Port the `store` module (saving readings) to `src/lib/store.ts`, calling the FastAPI endpoints
