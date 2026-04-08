// Local dev entrypoint: wraps the Vercel serverless export with a real
// `app.listen()` so the frontend can talk to /api during `pnpm run dev`.
import app from './index.js'

const PORT = process.env.API_PORT || 3001

app.listen(PORT, () => {
  console.log(`[api] Dev server listening on http://localhost:${PORT}`)
})
