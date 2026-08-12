import { Router } from 'express'
import db from '../../database/db.js'

const router = Router()

// Get votes for a place
router.get('/api/places/:id/votes', async (req, res) => {
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
router.post('/api/places/:id/votes', async (req, res) => {
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
router.delete('/api/places/:id/votes', async (req, res) => {
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

export default router
