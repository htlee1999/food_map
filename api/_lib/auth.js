import './env.js'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import db from '../../database/db.js'

// Secrets must be configured in production; dev falls back to known values
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function requireSecret(name, devFallback) {
  const value = process.env[name]
  if (value) return value
  if (IS_PRODUCTION) {
    throw new Error(`${name} must be set in production`)
  }
  return devFallback
}

const ADMIN_SECRET = requireSecret('ADMIN_SECRET', 'changeme-secret-key')
const SESSION_SECRET = requireSecret('SESSION_SECRET', 'changeme-session-secret')

export const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID
export const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID)

export const SESSION_COOKIE_NAME = 'session'
export const SESSION_DURATION_DAYS = 30
export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PRODUCTION,
}

export const PUBLIC_USER_FIELDS = 'id, email, display_name, avatar_url, is_admin'

// The session token carries only the user id; the secret stays private to this module
export function createSessionToken(userId) {
  return jwt.sign({ userId }, SESSION_SECRET, { expiresIn: `${SESSION_DURATION_DAYS}d` })
}

// True when the request carries the legacy admin secret header
export function isAdminKeyRequest(req) {
  return req.headers['x-admin-key'] === ADMIN_SECRET
}

export async function getSessionUser(req) {
  const token = req.cookies[SESSION_COOKIE_NAME]
  if (!token) return null

  try {
    const { userId } = jwt.verify(token, SESSION_SECRET)
    const result = await db.query(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = $1`, [userId])
    return result.rows[0] || null
  } catch {
    // Expired or tampered token — treat as signed out
    return null
  }
}

export async function requireUser(req, res, next) {
  const user = await getSessionUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Sign in required' })
  }
  req.user = user
  next()
}

// Admin = legacy secret header, or a signed-in user with the is_admin flag
export async function requireAdmin(req, res, next) {
  if (isAdminKeyRequest(req)) return next()

  const user = await getSessionUser(req)
  if (user?.is_admin) {
    req.user = user
    return next()
  }
  return res.status(403).json({ error: 'Admin access required' })
}
