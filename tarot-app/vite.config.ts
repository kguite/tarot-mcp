import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The journal is on the FastAPI server. Forwarding keeps the app on one address, so no CORS setup.
  server: { proxy: { '/readings': 'http://127.0.0.1:8001' } },
})
