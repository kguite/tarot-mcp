import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { DrawSheet } from './components/DrawSheet'
import { Nav } from './components/Nav'
import type { Page } from './components/Nav'
import { SPREADS } from './data'
import { isFinished, newReading } from './lib/deck'
import type { Reading } from './lib/deck'
import { setTokenSource } from './lib/store'
import { Draw } from './screens/Draw'
import { Journal } from './screens/Journal'
import { Learn } from './screens/Learn'
import { Settings } from './screens/Placeholders'
import { Today } from './screens/Today'
import styles from './App.module.css'

// Which page is showing is plain state for now; a router (with real URLs and the back button) can come later.
// The reading in progress lives here, above the pages, so switching tabs never loses it.
function App() {
  const [page, setPage] = useState<Page>('today')
  const [reading, setReading] = useState<Reading | null>(null)
  const [choosing, setChoosing] = useState(false)
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()

  // Give the journal's requests a way to get your token. Set during render, not in an effect: a
  // screen's effects run before App's, so the Journal would ask for readings before it was set.
  setTokenSource(isAuthenticated ? () => getAccessTokenSilently() : null)

  function start(spreadId: string) {
    setReading(newReading(SPREADS.find((s) => s.id === spreadId)!))
    setChoosing(false)
    setPage('draw')
  }

  // The Draw star asks first (continue, or which new reading) instead of going straight to a page.
  function go(next: Page) {
    if (next === 'draw') setChoosing(true)
    else setPage(next)
  }

  return (
    <>
      <Nav current={page} onGo={go} />
      <main className={styles.content}>
        {page === 'today' && <Today onStart={start} />}
        {page === 'draw' && reading && <Draw key={reading.draws.map((d) => d.card.id).join()} reading={reading} onChange={setReading} />}
        {page === 'learn' && <Learn />}
        {/* Wait while Auth0 checks for a saved login, or the Journal would load as logged out. */}
        {page === 'journal' && !isLoading && <Journal />}
        {page === 'settings' && <Settings />}
      </main>
      {choosing && (
        <DrawSheet
          reading={reading && !isFinished(reading) ? reading : null}
          onContinue={() => {
            setChoosing(false)
            setPage('draw')
          }}
          onStart={start}
          onClose={() => setChoosing(false)}
        />
      )}
    </>
  )
}

export default App
