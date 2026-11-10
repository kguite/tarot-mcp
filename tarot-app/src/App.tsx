import { CARDS, SPREADS } from './data'

function App() {
  return (
    <main>
      <h1>Tarot</h1>
      <p>
        {CARDS.length} cards and {SPREADS.length} spreads loaded.
      </p>
    </main>
  )
}

export default App
