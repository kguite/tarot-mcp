# Tarot app

A tarot app for reflection and journaling, built with Vite, React and TypeScript.
See `../CLAUDE.md` for the product and plans, and `../STEPS.md` for how it was built.

```
npm install
npm run dev       # local server, usually http://localhost:5173
npm run build     # type-check and bundle into dist/
npm run lint
```

- `src/data/` holds the card data as JSON, with types in `types.ts`. Import it from `./data`.
- `prototype/draw.html` is the single-file prototype the app is being ported from.
