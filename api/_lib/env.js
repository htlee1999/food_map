import dotenv from 'dotenv'

// Load environment variables from .env.local first, then .env.
// Imported for its side effect before any module reads process.env.
dotenv.config({ path: '.env.local' })
dotenv.config()
