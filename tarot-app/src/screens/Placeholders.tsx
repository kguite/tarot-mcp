import { useAuth0 } from '@auth0/auth0-react'
import { Button } from '../components/Button'
import { Eyebrow } from '../components/Eyebrow'
import screen from './Screen.module.css'

// Settings: your account (logging in keeps a private journal) and the credits.
export function Settings() {
  const { isAuthenticated, user, error, loginWithRedirect, logout } = useAuth0()
  return (
    <div className={screen.screen}>
      <div className={screen.title}>
        <Eyebrow gold>Settings</Eyebrow>
        <h1>Settings</h1>
      </div>

      <h2 className={screen.heading}>Account</h2>
      {isAuthenticated ? (
        <>
          <p className={screen.note}>Logged in as {user?.name ?? user?.email}. Your journal is private to you.</p>
          {/* The Auth0 user id: what the server files your readings under. */}
          <p className={screen.note}>Account id: {user?.sub}</p>
          <Button variant="secondary" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Log out
          </Button>
        </>
      ) : (
        <>
          <p className={screen.note}>Log in to keep a private journal. The cards work without it.</p>
          {/* Auth0 sends a refused login back in the address bar; say it here instead. */}
          {error && <p className={screen.error} role="alert">The login didn’t work: {error.message}</p>}
          <Button onClick={() => loginWithRedirect()}>Log in</Button>
        </>
      )}

      <h2 className={screen.heading}>Credits</h2>
      <p className={screen.note}>
        Card art by Pamela Colman Smith for the 1909 Rider-Waite tarot, from the original “Roses &amp; Lilies” printing,
        scanned by Saskia Jansen. Public domain, via{' '}
        <a href="https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)">Wikimedia Commons</a>.
      </p>
    </div>
  )
}
