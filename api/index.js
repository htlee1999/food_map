import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables from .env.local first, then .env
dotenv.config({ path: '.env.local' })
dotenv.config()

// Import database utilities
import db from '../database/db.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Database connection will be handled by the db module

// Admin authentication middleware
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'changeme-secret-key'

function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Routes

// Get all places
app.get('/api/places', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM places ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching places:', error)
    res.status(500).json({ error: 'Failed to fetch places' })
  }
})

// Add a new place (admin only)
app.post('/api/places', requireAdmin, async (req, res) => {
  try {
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
      `INSERT INTO places (name, address, coords, description, cuisine_type, price_range, tier) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        newPlace.name,
        newPlace.address,
        JSON.stringify(newPlace.coords),
        newPlace.description || null,
        newPlace.cuisine_type || null,
        newPlace.price_range || null,
        newPlace.tier || null,
      ]
    )

    res.json({ message: 'Place added successfully', place: result.rows[0] })
  } catch (error) {
    console.error('Error adding place:', error)
    res.status(500).json({ error: 'Failed to save place' })
  }
})

// Update a place (admin only)
app.put('/api/places/:id', requireAdmin, async (req, res) => {
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
           cuisine_type = $5, price_range = $6, tier = $7, updated_at = NOW()
       WHERE id = $8 
       RETURNING *`,
      [
        updatedPlace.name,
        updatedPlace.address,
        JSON.stringify(updatedPlace.coords),
        updatedPlace.description || null,
        updatedPlace.cuisine_type || null,
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
app.delete('/api/places/:id', requireAdmin, async (req, res) => {
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




// Get comments for a place
app.get('/api/places/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.query(
      'SELECT * FROM comments WHERE place_id = $1 ORDER BY created_at DESC',
      [id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// Add a comment to a place
app.post('/api/places/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' })
    }

    // Check if place exists
    const existingPlace = await db.query('SELECT id FROM places WHERE id = $1', [id])
    if (existingPlace.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' })
    }

    const result = await db.query(
      'INSERT INTO comments (place_id, content) VALUES ($1, $2) RETURNING *',
      [id, content.trim()]
    )

    res.json({ message: 'Comment added successfully', comment: result.rows[0] })
  } catch (error) {
    console.error('Error adding comment:', error)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

// Delete a comment (admin only)
app.delete('/api/comments/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const existingComment = await db.query('SELECT id FROM comments WHERE id = $1', [id])
    if (existingComment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id])
    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

// ==================== VOTES ====================

// Get votes for a place
app.get('/api/places/:id/votes', async (req, res) => {
  try {
    const { id } = req.params
    const { voter_id } = req.query

    // Get vote counts
    const countsResult = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE vote_type = 'up') as up_count,
        COUNT(*) FILTER (WHERE vote_type = 'down') as down_count
       FROM votes WHERE place_id = $1`,
      [id]
    )

    const counts = countsResult.rows[0]

    // Get user's vote if voter_id provided
    let userVote = null
    if (voter_id) {
      const userVoteResult = await db.query(
        'SELECT vote_type FROM votes WHERE place_id = $1 AND voter_id = $2',
        [id, voter_id]
      )
      if (userVoteResult.rows.length > 0) {
        userVote = userVoteResult.rows[0].vote_type
      }
    }

    res.json({
      up: parseInt(counts.up_count) || 0,
      down: parseInt(counts.down_count) || 0,
      userVote,
    })
  } catch (error) {
    console.error('Error fetching votes:', error)
    res.status(500).json({ error: 'Failed to fetch votes' })
  }
})

// Submit or update a vote
app.post('/api/places/:id/votes', async (req, res) => {
  try {
    const { id } = req.params
    const { vote_type, voter_id } = req.body

    if (!vote_type || !['up', 'down'].includes(vote_type)) {
      return res.status(400).json({ error: 'Invalid vote_type. Must be "up" or "down"' })
    }

    if (!voter_id) {
      return res.status(400).json({ error: 'voter_id is required' })
    }

    // Check if place exists
    const existingPlace = await db.query('SELECT id FROM places WHERE id = $1', [id])
    if (existingPlace.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' })
    }

    // Upsert vote (insert or update on conflict)
    const result = await db.query(
      `INSERT INTO votes (place_id, vote_type, voter_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (place_id, voter_id)
       DO UPDATE SET vote_type = $2
       RETURNING *`,
      [id, vote_type, voter_id]
    )

    res.json({ message: 'Vote recorded', vote: result.rows[0] })
  } catch (error) {
    console.error('Error submitting vote:', error)
    res.status(500).json({ error: 'Failed to submit vote' })
  }
})

// Remove a vote
app.delete('/api/places/:id/votes', async (req, res) => {
  try {
    const { id } = req.params
    const { voter_id } = req.body

    if (!voter_id) {
      return res.status(400).json({ error: 'voter_id is required' })
    }

    await db.query(
      'DELETE FROM votes WHERE place_id = $1 AND voter_id = $2',
      [id, voter_id]
    )

    res.json({ message: 'Vote removed' })
  } catch (error) {
    console.error('Error removing vote:', error)
    res.status(500).json({ error: 'Failed to remove vote' })
  }
})

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
