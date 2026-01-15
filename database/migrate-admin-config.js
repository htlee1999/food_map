import db from './db.js'

async function migrate() {
  console.log('Running migration: Create admin config tables and seed data...')

  try {
    // Create cuisines table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cuisines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Created cuisines table')

    // Create cuisine_tags table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cuisine_tags (
        id SERIAL PRIMARY KEY,
        cuisine_id INTEGER REFERENCES cuisines(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cuisine_id, name)
      )
    `)
    console.log('Created cuisine_tags table')

    // Create tiers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tiers (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL,
        color_class VARCHAR(100),
        color_hex VARCHAR(20),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Created tiers table')

    // Seed cuisines
    const cuisines = [
      { name: 'Zi Char', sort_order: 1 },
      { name: 'Ramen', sort_order: 2 },
      { name: 'Korean', sort_order: 3 },
      { name: 'European', sort_order: 4 },
      { name: 'Cafe', sort_order: 5 },
      { name: 'South East Asian', sort_order: 6 },
    ]

    for (const cuisine of cuisines) {
      await db.query(
        `INSERT INTO cuisines (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [cuisine.name, cuisine.sort_order]
      )
    }
    console.log('Seeded cuisines')

    // Get cuisine IDs for tags
    const cuisineRows = await db.query('SELECT id, name FROM cuisines')
    const cuisineMap = {}
    for (const row of cuisineRows.rows) {
      cuisineMap[row.name] = row.id
    }

    // Seed tags
    const tagsByCategory = {
      'Cafe': ['bagel', 'just coffee', 'fusion', 'sandwich'],
      'South East Asian': ['thai', 'indonesian', 'vietnamese', 'filipino', 'malaysian', 'local'],
      'European': ['spanish', 'italian', 'french'],
      'Korean': ['bbq', 'fried chicken', 'stew/jjigae', 'bibimbap', 'tteokbokki', 'army stew', 'jjajangmyeon'],
      'Ramen': ['tonkotsu', 'shoyu', 'miso', 'shio', 'tsukemen', 'spicy', 'dandanmen'],
    }

    for (const [cuisineName, tags] of Object.entries(tagsByCategory)) {
      const cuisineId = cuisineMap[cuisineName]
      if (cuisineId) {
        for (const tag of tags) {
          await db.query(
            `INSERT INTO cuisine_tags (cuisine_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [cuisineId, tag]
          )
        }
      }
    }
    console.log('Seeded cuisine tags')

    // Seed tiers
    const tiers = [
      { code: 'S', description: "Would bring gf's parents", color_class: 'bg-pink-100 text-pink-700 border border-pink-200', color_hex: '#f9a8d4', sort_order: 1 },
      { code: 'A', description: 'Worth the Grab ride', color_class: 'bg-emerald-100 text-emerald-700 border border-emerald-200', color_hex: '#86efac', sort_order: 2 },
      { code: 'B', description: 'If nearby, why not', color_class: 'bg-amber-100 text-amber-700 border border-amber-200', color_hex: '#fde047', sort_order: 3 },
      { code: 'C', description: 'Last resort makan', color_class: 'bg-orange-100 text-orange-700 border border-orange-200', color_hex: '#fdba74', sort_order: 4 },
      { code: 'D', description: 'Leftovers > this', color_class: 'bg-rose-100 text-rose-700 border border-rose-200', color_hex: '#fca5a5', sort_order: 5 },
      { code: 'F', description: 'Avoid like GST hikes', color_class: 'bg-slate-100 text-slate-700 border border-slate-200', color_hex: '#d1d5db', sort_order: 6 },
    ]

    for (const tier of tiers) {
      await db.query(
        `INSERT INTO tiers (code, description, color_class, color_hex, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO UPDATE SET description = $2, color_class = $3, color_hex = $4, sort_order = $5`,
        [tier.code, tier.description, tier.color_class, tier.color_hex, tier.sort_order]
      )
    }
    console.log('Seeded tiers')

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  } finally {
    await db.close()
  }
}

migrate()
