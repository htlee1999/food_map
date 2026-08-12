import { Router } from 'express'
import db from '../../database/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { MAX_REVIEW_LENGTH } from '../_lib/constants.js'

const router = Router()

// Get comments for a place
router.get('/api/places/:id/comments', async (req, res) => {
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

// Add a comment to a place (admin only)
router.post('/api/places/:id/comments', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' })
    }
    if (content.length > MAX_REVIEW_LENGTH) {
      return res.status(400).json({ error: `Comment must be under ${MAX_REVIEW_LENGTH} characters` })
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
router.delete('/api/comments/:id', requireAdmin, async (req, res) => {
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

export default router
