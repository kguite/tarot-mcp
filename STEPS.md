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

## Next

- Port the `store` module (saving readings) to `src/lib/store.ts`
