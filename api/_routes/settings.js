import { Router } from 'express'
import db from '../../database/db.js'
import { requireAdmin } from '../_lib/auth.js'

const router = Router()

// Get setting by key (public)
router.get('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params
    const result = await db.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = $1',
      [key]
    )

    if (result.rows.length === 0) {
      return res.json({ value: null })
    }
    res.json({ value: result.rows[0].setting_value })
  } catch (error) {
    console.error('Error fetching setting:', error)
    res.status(500).json({ error: 'Failed to fetch setting' })
  }
})

// Update setting by key (admin only)
router.put('/api/settings/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' })
    }

    const result = await db.query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ($1, $2)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = $2, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value)]
    )

    res.json({ message: 'Setting updated', setting: result.rows[0] })
  } catch (error) {
    console.error('Error updating setting:', error)
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

export default router
