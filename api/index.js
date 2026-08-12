// App assembly: middleware + one router per domain (see api/_routes/).
// The _lib/_routes directories start with an underscore so Vercel does not
// deploy them as standalone serverless functions.
import './_lib/env.js'
import express from 'express'
import cookieParser from 'cookie-parser'

import db from '../database/db.js'
import authRoutes from './_routes/auth.js'
import placesRoutes from './_routes/places.js'
import ratingsRoutes from './_routes/ratings.js'
import groupsRoutes from './_routes/groups.js'
import commentsRoutes from './_routes/comments.js'
import votesRoutes from './_routes/votes.js'
import configRoutes from './_routes/config.js'
import settingsRoutes from './_routes/settings.js'
import blogRoutes from './_routes/blog.js'

const app = express()

// Middleware (the app is same-origin behind Vercel, so no CORS layer)
app.use(express.json())
app.use(cookieParser())

app.use(authRoutes)
app.use(placesRoutes)
app.use(ratingsRoutes)
app.use(groupsRoutes)
app.use(commentsRoutes)
app.use(votesRoutes)
app.use(configRoutes)
app.use(settingsRoutes)
app.use(blogRoutes)

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck()
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth,
    })
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    })
  }
})

// Export the app for Vercel
export default app
