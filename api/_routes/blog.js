import { Router } from 'express'
import multer from 'multer'
import { put } from '@vercel/blob'
import db from '../../database/db.js'
import { requireAdmin } from '../_lib/auth.js'

const router = Router()

// List blog posts (public) - lightweight fields for the list view
router.get('/api/blog', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, location, hero, summary, rating, sort_order, created_at, updated_at
       FROM blog_posts
       ORDER BY sort_order ASC, created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    res.status(500).json({ error: 'Failed to fetch blog posts' })
  }
})

// Upload blog image (admin only). Returns a public Blob URL.
// Registered before /api/blog/:id so "upload" is never treated as an id.
const blogUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})

router.post('/api/blog/upload', requireAdmin, blogUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image uploads are allowed' })
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'Blob storage is not configured on the server' })
    }

    const safeName = (req.file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')
    const blob = await put(`blog/${Date.now()}-${safeName}`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      addRandomSuffix: true,
    })

    res.json({ url: blob.url })
  } catch (error) {
    console.error('Blob upload failed:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// Get one blog post (public) - includes full content JSON
router.get('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.query('SELECT * FROM blog_posts WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching blog post:', error)
    res.status(500).json({ error: 'Failed to fetch blog post' })
  }
})

// Create blog post (admin only)
router.post('/api/blog', requireAdmin, async (req, res) => {
  try {
    const { title, location, hero, summary, rating, content, sort_order } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    const result = await db.query(
      `INSERT INTO blog_posts (title, location, hero, summary, rating, content, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title.trim(),
        location || null,
        hero || null,
        summary || null,
        rating || null,
        JSON.stringify(content || {}),
        sort_order || 0,
      ]
    )
    res.json({ message: 'Blog post created', post: result.rows[0] })
  } catch (error) {
    console.error('Error creating blog post:', error)
    res.status(500).json({ error: 'Failed to create blog post' })
  }
})

// Update blog post (admin only)
router.put('/api/blog/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { title, location, hero, summary, rating, content, sort_order } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    const result = await db.query(
      `UPDATE blog_posts SET
        title = $1, location = $2, hero = $3, summary = $4, rating = $5,
        content = $6, sort_order = COALESCE($7, sort_order), updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [
        title.trim(),
        location || null,
        hero || null,
        summary || null,
        rating || null,
        JSON.stringify(content || {}),
        sort_order,
        id,
      ]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' })
    }
    res.json({ message: 'Blog post updated', post: result.rows[0] })
  } catch (error) {
    console.error('Error updating blog post:', error)
    res.status(500).json({ error: 'Failed to update blog post' })
  }
})

// Delete blog post (admin only)
router.delete('/api/blog/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' })
    }
    res.json({ message: 'Blog post deleted' })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    res.status(500).json({ error: 'Failed to delete blog post' })
  }
})

export default router
