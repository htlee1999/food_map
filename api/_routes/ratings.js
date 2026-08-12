import { Router } from 'express'
import db from '../../database/db.js'
import { getSessionUser, requireUser } from '../_lib/auth.js'
import { VISIBLE_USERS_SQL, MAX_REVIEW_LENGTH } from '../_lib/constants.js'

const router = Router()

// Get ratings for a place, scoped to the signed-in user's friend groups
// (their own rating plus ratings from anyone sharing a group with them).
// Anonymous visitors get an empty list — friend ratings are not public.
router.get('/api/places/:id/ratings', async (req, res) => {
  try {
    const user = await getSessionUser(req)
    if (!user) return res.json([])

    const result = await db.query(
      `SELECT r.id, r.user_id, r.tier, r.review, r.updated_at,
              u.display_name, u.avatar_url
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.place_id = $2
         AND (r.user_id = $1 OR r.user_id IN (${VISIBLE_USERS_SQL}))
       ORDER BY r.updated_at DESC`,
      [user.id, req.params.id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching ratings:', error)
    res.status(500).json({ error: 'Failed to fetch ratings' })
  }
})

// Create or update the signed-in user's rating for a place
router.put('/api/places/:id/rating', requireUser, async (req, res) => {
  const { tier, review } = req.body
  if (!tier) {
    return res.status(400).json({ error: 'Missing required field: tier' })
  }
  if (review && review.length > MAX_REVIEW_LENGTH) {
    return res.status(400).json({ error: `Review must be under ${MAX_REVIEW_LENGTH} characters` })
  }

  try {
    const validTier = await db.query('SELECT code FROM tiers WHERE code = $1', [tier])
    if (validTier.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid tier' })
    }

    const result = await db.query(
      `INSERT INTO ratings (user_id, place_id, tier, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, place_id)
       DO UPDATE SET tier = EXCLUDED.tier, review = EXCLUDED.review
       RETURNING *`,
      [req.user.id, req.params.id, tier, review || null]
    )
    res.json({ message: 'Rating saved', rating: result.rows[0] })
  } catch (error) {
    console.error('Error saving rating:', error)
    res.status(500).json({ error: 'Failed to save rating' })
  }
})

// Remove the signed-in user's rating for a place
router.delete('/api/places/:id/rating', requireUser, async (req, res) => {
  try {
    await db.query('DELETE FROM ratings WHERE user_id = $1 AND place_id = $2', [
      req.user.id,
      req.params.id,
    ])
    res.json({ message: 'Rating removed' })
  } catch (error) {
    console.error('Error removing rating:', error)
    res.status(500).json({ error: 'Failed to remove rating' })
  }
})

// Per-place rating summary across the signed-in user's friend groups,
// used to color map pins in the friends view.
router.get('/api/ratings/summary', requireUser, async (req, res) => {
  try {
    // The median is the actual middle rating (best-biased on even counts),
    // ordered by tier sort order with ties broken by code so the result is
    // deterministic even if two tiers share a sort_order.
    const result = await db.query(
      `WITH visible_ratings AS (
         SELECT r.place_id, r.user_id, r.tier, t.sort_order
         FROM ratings r
         JOIN tiers t ON t.code = r.tier
         WHERE r.user_id = $1 OR r.user_id IN (${VISIBLE_USERS_SQL})
       )
       SELECT sub.place_id, sub.rating_count, sub.my_tier, median.tier AS group_tier
       FROM (
         SELECT place_id,
                COUNT(*)::int AS rating_count,
                MAX(tier) FILTER (WHERE user_id = $1) AS my_tier
         FROM visible_ratings
         GROUP BY place_id
       ) sub
       JOIN LATERAL (
         SELECT tier FROM visible_ratings
         WHERE place_id = sub.place_id
         ORDER BY sort_order, tier
         OFFSET (sub.rating_count - 1) / 2 LIMIT 1
       ) median ON TRUE`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching ratings summary:', error)
    res.status(500).json({ error: 'Failed to fetch ratings summary' })
  }
})

export default router
