/**
 * Run the region column migration
 */
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  console.log('🚀 Starting region column migration...\n')

  // Read DATABASE_URL from .env file
  let databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    try {
      const envPath = path.join(__dirname, '../../.env')
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/^DATABASE_URL=(.+)$/m)
      if (match) {
        databaseUrl = match[1].trim()
      }
    } catch (err) {
      console.error('❌ ERROR: Could not read DATABASE_URL from .env file')
      process.exit(1)
    }
  }

  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL not found')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  })

  try {
    const client = await pool.connect()
    console.log('✅ Connected to Neon database\n')

    // Add region column
    console.log('📝 Adding region column to places table...')
    await client.query(`
      ALTER TABLE places ADD COLUMN IF NOT EXISTS region VARCHAR(20)
    `)
    console.log('✅ Region column added')

    // Add index
    console.log('📝 Creating index on region column...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_places_region ON places(region)
    `)
    console.log('✅ Index created')

    // Check current table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'places'
      ORDER BY ordinal_position
    `)

    console.log('\n📊 Current places table structure:')
    tableInfo.rows.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
      console.log(`  - ${col.column_name}: ${col.data_type}${length}`)
    })

    // Check how many places exist
    const countResult = await client.query('SELECT COUNT(*) as count FROM places')
    const placeCount = parseInt(countResult.rows[0].count)

    console.log(`\n📍 Found ${placeCount} places in database`)

    client.release()
    await pool.end()

    console.log('\n✅ Migration completed successfully!\n')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    await pool.end()
    process.exit(1)
  }
}

runMigration()
