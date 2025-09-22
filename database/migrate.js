const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database migration script
async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔄 Running database migrations...');
    await client.query(schema);
    console.log('✅ Database migrations completed successfully');

    // Check if we have existing data to migrate
    const result = await client.query('SELECT COUNT(*) FROM places');
    const placeCount = parseInt(result.rows[0].count);
    
    if (placeCount === 0) {
      console.log('📝 No existing places found. Database is ready for new data.');
    } else {
      console.log(`📊 Found ${placeCount} existing places in database.`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrate;
