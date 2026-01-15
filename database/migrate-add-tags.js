import db from './db.js'

async function migrate() {
  console.log('Running migration: Add tags column to places table...')

  try {
    await db.query(`
      ALTER TABLE places
      ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'
    `)
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  } finally {
    await db.close()
  }
}

migrate()
