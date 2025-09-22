import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables from .env.local first, then .env
dotenv.config({ path: '.env.local' })
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database migration script
async function migrate() {
  // Check if DATABASE_URL is provided
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found. Skipping database migration.')
    console.log('💡 This is normal for local development without a database.')
    return
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  })

  try {
    console.log('🔄 Connecting to database...')
    await client.connect()
    console.log('✅ Connected to database')

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    console.log('🔄 Running database migrations...')
    await client.query(schema)
    
    // Handle migration from rating to tier column
    try {
      // Check if rating column exists and tier doesn't
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'places' 
        AND column_name IN ('rating', 'tier')
      `)
      
      const hasRating = columnCheck.rows.some(row => row.column_name === 'rating')
      const hasTier = columnCheck.rows.some(row => row.column_name === 'tier')
      
      if (hasRating && !hasTier) {
        console.log('🔄 Migrating rating column to tier...')
        await client.query('ALTER TABLE places ADD COLUMN tier VARCHAR(10)')
        await client.query('ALTER TABLE places DROP COLUMN rating')
        console.log('✅ Successfully migrated rating to tier column')
      }
    } catch (migrationError) {
      console.log('ℹ️  Column migration not needed or already completed')
    }
    
    console.log('✅ Database migrations completed successfully')

    // Check if we have existing data to migrate
    const result = await client.query('SELECT COUNT(*) FROM places')
    const placeCount = parseInt(result.rows[0].count)

    if (placeCount === 0) {
      console.log('📝 No existing places found. Database is ready for new data.')
    } else {
      console.log(`📊 Found ${placeCount} existing places in database.`)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => {
      console.log('🎉 Migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

export default migrate
