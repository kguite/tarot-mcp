// Logging in, with Auth0 (the tenant Mise uses). None of these are secrets: a browser app's client
// id is public, and the API identifier is the audience every token names.
export const AUTH0 = {
  domain: 'dev-khp3k0qx6qktdf5u.us.auth0.com',
  clientId: '1o84PKsTikBcRBFJJa98XgwInypkxxxw',
  // The API the token is for (mcp-server/auth.py checks the same value).
  audience: 'https://tarot-api-5c7k.onrender.com',
}
