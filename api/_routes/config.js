import { Router } from 'express'
import db from '../../database/db.js'
import { requireAdmin } from '../_lib/auth.js'

const router = Router()

// Get all config (cuisines, tags, tiers) - Public
router.get('/api/config', async (req, res) => {
  try {
    // Get cuisines
    const cuisinesResult = await db.query('SELECT * FROM cuisines ORDER BY sort_order, name')

    // Get tags grouped by cuisine
    const tagsResult = await db.query(`
      SELECT ct.*, c.name as cuisine_name
      FROM cuisine_tags ct
      JOIN cuisines c ON ct.cuisine_id = c.id
      ORDER BY c.sort_order, ct.name
    `)

    // Get tiers
    const tiersResult = await db.query('SELECT * FROM tiers ORDER BY sort_order')

    // Build tagsByCategory object
    const tagsByCategory = {}
    for (const tag of tagsResult.rows) {
      if (!tagsByCategory[tag.cuisine_name]) {
        tagsByCategory[tag.cuisine_name] = []
      }
      tagsByCategory[tag.cuisine_name].push(tag.name)
    }

    res.json({
      cuisines: cuisinesResult.rows,
      tags: tagsResult.rows,
      tagsByCategory,
      tiers: tiersResult.rows,
    })
  } catch (error) {
    console.error('Error fetching config:', error)
    res.status(500).json({ error: 'Failed to fetch config' })
  }
})

// Add cuisine (admin only)
router.post('/api/cuisines', requireAdmin, async (req, res) => {
  try {
    const { name, sort_order } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await db.query(
      'INSERT INTO cuisines (name, sort_order) VALUES ($1, $2) RETURNING *',
      [name, sort_order || 0]
    )
    res.json({ message: 'Cuisine added', cuisine: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cuisine already exists' })
    }
    console.error('Error adding cuisine:', error)
    res.status(500).json({ error: 'Failed to add cuisine' })
  }
})

// Update cuisine (admin only)
router.put('/api/cuisines/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, sort_order } = req.body

    const result = await db.query(
      'UPDATE cuisines SET name = COALESCE($1, name), sort_order = COALESCE($2, sort_order) WHERE id = $3 RETURNING *',
      [name, sort_order, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuisine not found' })
    }
    res.json({ message: 'Cuisine updated', cuisine: result.rows[0] })
  } catch (error) {
    console.error('Error updating cuisine:', error)
    res.status(500).json({ error: 'Failed to update cuisine' })
  }
})

// Delete cuisine (admin only)
router.delete('/api/cuisines/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.query('DELETE FROM cuisines WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuisine not found' })
    }
    res.json({ message: 'Cuisine deleted' })
  } catch (error) {
    console.error('Error deleting cuisine:', error)
    res.status(500).json({ error: 'Failed to delete cuisine' })
  }
})

// Add tag to cuisine (admin only)
router.post('/api/cuisines/:id/tags', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' })
    }

    const result = await db.query(
      'INSERT INTO cuisine_tags (cuisine_id, name) VALUES ($1, $2) RETURNING *',
      [id, name]
    )
    res.json({ message: 'Tag added', tag: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Tag already exists for this cuisine' })
    }
    console.error('Error adding tag:', error)
    res.status(500).json({ error: 'Failed to add tag' })
  }
})

// Delete tag (admin only)
router.delete('/api/tags/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.query('DELETE FROM cuisine_tags WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' })
    }
    res.json({ message: 'Tag deleted' })
  } catch (error) {
    console.error('Error deleting tag:', error)
    res.status(500).json({ error: 'Failed to delete tag' })
  }
})

// Add tier (admin only)
router.post('/api/tiers', requireAdmin, async (req, res) => {
  try {
    const { code, description, color_class, color_hex, sort_order } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Tier code is required' })
    }

    const result = await db.query(
      `INSERT INTO tiers (code, description, color_class, color_hex, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [code, description || '', color_class || 'bg-slate-100 text-slate-800', color_hex || '#64748b', sort_order || 0]
    )
    res.json({ message: 'Tier added', tier: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Tier code already exists' })
    }
    console.error('Error adding tier:', error)
    res.status(500).json({ error: 'Failed to add tier' })
  }
})

// Update tier (admin only)
router.put('/api/tiers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { code, description, color_class, color_hex, sort_order } = req.body

    const result = await db.query(
      `UPDATE tiers SET
        code = COALESCE($1, code),
        description = COALESCE($2, description),
        color_class = COALESCE($3, color_class),
        color_hex = COALESCE($4, color_hex),
        sort_order = COALESCE($5, sort_order)
       WHERE id = $6 RETURNING *`,
      [code, description, color_class, color_hex, sort_order, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tier not found' })
    }
    res.json({ message: 'Tier updated', tier: result.rows[0] })
  } catch (error) {
    console.error('Error updating tier:', error)
    res.status(500).json({ error: 'Failed to update tier' })
  }
})

// Delete tier (admin only)
router.delete('/api/tiers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.query('DELETE FROM tiers WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tier not found' })
    }
    res.json({ message: 'Tier deleted' })
  } catch (error) {
    console.error('Error deleting tier:', error)
    res.status(500).json({ error: 'Failed to delete tier' })
  }
})

export default router
