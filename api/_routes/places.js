import { Router } from 'express'
import db from '../../database/db.js'
import { getSessionUser, isAdminKeyRequest, requireAdmin } from '../_lib/auth.js'
import { VISIBLE_USERS_SQL } from '../_lib/constants.js'

const router = Router()

// Get all places. Admin/editorial places (created_by NULL) are public;
// friend-added places are only returned to their creator's groups.
router.get('/api/places', async (req, res) => {
  try {
    const user = await getSessionUser(req)
    const result = user
      ? await db.query(
          `SELECT * FROM places
           WHERE created_by IS NULL OR created_by = $1 OR created_by IN (${VISIBLE_USERS_SQL})
           ORDER BY created_at DESC`,
          [user.id]
        )
      : await db.query('SELECT * FROM places WHERE created_by IS NULL ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching places:', error)
    res.status(500).json({ error: 'Failed to fetch places' })
  }
})

// Add a new place. Admins create public/editorial places; signed-in friends
// create places visible only to their groups (created_by set).
router.post('/api/places', async (req, res) => {
  try {
    const isAdminRequest = isAdminKeyRequest(req)
    const user = await getSessionUser(req)
    if (!isAdminRequest && !user) {
      return res.status(403).json({ error: 'Sign in required to add places' })
    }
    const createdBy = isAdminRequest || user?.is_admin ? null : user.id

    const newPlace = req.body

    // Validate required fields
    if (!newPlace.name || !newPlace.address || !newPlace.coords) {
      return res.status(400).json({ error: 'Missing required fields: name, address, coords' })
    }

    // Check if place already exists
    const existingPlace = await db.query(
      'SELECT id FROM places WHERE LOWER(name) = LOWER($1) AND LOWER(address) = LOWER($2)',
      [newPlace.name, newPlace.address]
    )

    if (existingPlace.rows.length > 0) {
      return res.status(409).json({ error: 'Place already exists' })
    }

    // Insert new place
    const result = await db.query(
      `INSERT INTO places (name, address, coords, description, cuisine_type, tags, price_range, tier, region, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        newPlace.name,
        newPlace.address,
        JSON.stringify(newPlace.coords),
        newPlace.description || null,
        newPlace.cuisine_type || null,
        JSON.stringify(newPlace.tags || []),
        newPlace.price_range || null,
        newPlace.tier || null,
        newPlace.region || null,
        createdBy,
      ]
    )
    const place = result.rows[0]

    // A friend's chosen tier doubles as their personal rating
    if (createdBy && place.tier) {
      await db.query(
        `INSERT INTO ratings (user_id, place_id, tier)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, place_id) DO UPDATE SET tier = EXCLUDED.tier`,
        [createdBy, place.id, place.tier]
      )
    }

    res.json({ message: 'Place added successfully', place })
  } catch (error) {
    console.error('Error adding place:', error)
    res.status(500).json({ error: 'Failed to save place' })
  }
})

// Update a place (admin only)
router.put('/api/places/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updatedPlace = req.body

    // Validate required fields
    if (!updatedPlace.name || !updatedPlace.address || !updatedPlace.coords) {
      return res.status(400).json({ error: 'Missing required fields: name, address, coords' })
    }

    // Check if place exists
    const existingPlace = await db.query('SELECT id FROM places WHERE id = $1', [id])
    if (existingPlace.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' })
    }

    // Update the place
    const result = await db.query(
      `UPDATE places
       SET name = $1, address = $2, coords = $3, description = $4,
           cuisine_type = $5, tags = $6, price_range = $7, tier = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        updatedPlace.name,
        updatedPlace.address,
        JSON.stringify(updatedPlace.coords),
        updatedPlace.description || null,
        updatedPlace.cuisine_type || null,
        JSON.stringify(updatedPlace.tags || []),
        updatedPlace.price_range || null,
        updatedPlace.tier || null,
        id,
      ]
    )

    res.json({ message: 'Place updated successfully', place: result.rows[0] })
  } catch (error) {
    console.error('Error updating place:', error)
    res.status(500).json({ error: 'Failed to update place' })
  }
})

// Delete a place (admin only)
router.delete('/api/places/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if place exists
    const existingPlace = await db.query('SELECT id FROM places WHERE id = $1', [id])
    if (existingPlace.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' })
    }

    // Delete the place
    await db.query('DELETE FROM places WHERE id = $1', [id])

    res.json({ message: 'Place deleted successfully' })
  } catch (error) {
    console.error('Error deleting place:', error)
    res.status(500).json({ error: 'Failed to delete place' })
  }
})

export default router
