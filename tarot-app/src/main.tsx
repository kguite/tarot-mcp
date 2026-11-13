import { Auth0Provider } from '@auth0/auth0-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AUTH0 } from './lib/auth'

// Refresh tokens kept in localStorage keep you logged in. Without them, staying logged in relies on a
// hidden cookie check that Safari and Firefox block, so you'd be logged out at random.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={AUTH0.domain}
      clientId={AUTH0.clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience: AUTH0.audience }}
      useRefreshTokens
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)
