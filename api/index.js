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

// Add a new place
app.post('/api/places', async (req, res) => {
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
      `INSERT INTO places (name, address, coords, description, cuisine_type, price_range, rating) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        newPlace.name,
        newPlace.address,
        JSON.stringify(newPlace.coords),
        newPlace.description || null,
        newPlace.cuisine_type || null,
        newPlace.price_range || null,
        newPlace.rating || null,
      ]
    )

    res.json({ message: 'Place added successfully', place: result.rows[0] })
  } catch (error) {
    console.error('Error adding place:', error)
    res.status(500).json({ error: 'Failed to save place' })
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
