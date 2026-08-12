import { Router } from 'express'
import db from '../../database/db.js'
import {
  GOOGLE_CLIENT_ID,
  googleAuthClient,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_DAYS,
  MILLISECONDS_PER_DAY,
  sessionCookieOptions,
  PUBLIC_USER_FIELDS,
  createSessionToken,
  getSessionUser,
} from '../_lib/auth.js'

const router = Router()

// Exchange a Google ID token for a session cookie
router.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' })
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google sign-in is not configured (VITE_GOOGLE_CLIENT_ID)' })
  }

  try {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    })
    const profile = ticket.getPayload()

    const result = await db.query(
      `INSERT INTO users (google_sub, email, display_name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_sub)
       DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, avatar_url = EXCLUDED.avatar_url
       RETURNING ${PUBLIC_USER_FIELDS}`,
      [profile.sub, profile.email, profile.name || null, profile.picture || null]
    )
    const user = result.rows[0]

    res.cookie(SESSION_COOKIE_NAME, createSessionToken(user.id), {
      ...sessionCookieOptions,
      maxAge: SESSION_DURATION_DAYS * MILLISECONDS_PER_DAY,
    })
    res.json({ user })
  } catch (error) {
    console.error('Google sign-in failed:', error)
    res.status(403).json({ error: 'Invalid Google credential' })
  }
})

// Current signed-in user (or { user: null } when signed out)
router.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getSessionUser(req)
    res.json({ user })
  } catch (error) {
    console.error('Error fetching session user:', error)
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

router.post('/api/auth/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions)
  res.json({ message: 'Logged out' })
})

export default router
