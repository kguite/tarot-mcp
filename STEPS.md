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

## Next

- One resource (Waite's text per card) with a test. The `daily_draw` prompt is built; write it up
  here as step 7
- Data shape: a shared `symbols.json` so details on different cards link up ("other cards with
  pillars"), and a `find_cards` tool that filters by symbol, suit and rank. Then the other 61
  cards in that shape, then explore the data through the MCP tools and adjust the shape
- Grow `mcp-server/` into a FastAPI app: REST plus `/mcp`, like speak_friend's `main.py`, then
  add its URL in Claude Desktop with "+ Add" and watch Claude choose `get_card`
- Access: levels, permissions and circles, in the build order in `ACCESS.md`
- Port the `store` module (saving readings) to `src/lib/store.ts`, calling the FastAPI endpoints
