import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

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

// Save multiple places (for CSV import)
app.post('/api/places/batch', async (req, res) => {
  try {
    const { places } = req.body

    if (!Array.isArray(places)) {
      return res.status(400).json({ error: 'Places must be an array' })
    }

    let addedCount = 0
    let skippedCount = 0

    // Process each place
    for (const newPlace of places) {
      try {
        // Check if place already exists
        const existingPlace = await db.query(
          'SELECT id FROM places WHERE LOWER(name) = LOWER($1) AND LOWER(address) = LOWER($2)',
          [newPlace.name, newPlace.address]
        )

        if (existingPlace.rows.length === 0) {
          // Insert new place
          await db.query(
            `INSERT INTO places (name, address, coords, description, cuisine_type, price_range, rating) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
          addedCount++
        } else {
          skippedCount++
        }
      } catch (error) {
        console.error(`Error processing place ${newPlace.name}:`, error)
        skippedCount++
      }
    }

    res.json({
      message: `Added ${addedCount} new places`,
      added: addedCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('Error in batch import:', error)
    res.status(500).json({ error: 'Failed to save places' })
  }
})

// Get user preferences (visited/want to visit)
app.get('/api/preferences', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT p.*, pr.visited, pr.want_to_visit, pr.notes FROM places p LEFT JOIN preferences pr ON p.id = pr.place_id ORDER BY p.created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    res.status(500).json({ error: 'Failed to fetch preferences' })
  }
})

// Save user preferences
app.post('/api/preferences', async (req, res) => {
  try {
    const { placeId, visited, wantToVisit, notes } = req.body

    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' })
    }

    // Use UPSERT to insert or update preferences
    const result = await db.query(
      `INSERT INTO preferences (place_id, user_id, visited, want_to_visit, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (place_id, user_id) 
       DO UPDATE SET 
         visited = EXCLUDED.visited,
         want_to_visit = EXCLUDED.want_to_visit,
         notes = EXCLUDED.notes,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [placeId, 'default_user', visited || false, wantToVisit || false, notes || null]
    )

    res.json({ message: 'Preferences saved successfully', preference: result.rows[0] })
  } catch (error) {
    console.error('Error saving preferences:', error)
    res.status(500).json({ error: 'Failed to save preferences' })
  }
})

// Proxy endpoint for Google Maps URLs (to bypass CORS)
app.get('/api/proxy/google-maps', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    console.log(`🌐 Proxying request to: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch URL: ${response.status}`,
      })
    }

    const html = await response.text()
    console.log(`📄 Fetched ${html.length} characters of HTML`)

    res.json({
      success: true,
      html: html,
      url: url,
      length: html.length,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({
      error: 'Failed to fetch URL',
      details: error.message,
    })
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
