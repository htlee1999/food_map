import { Client, Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool settings for better performance
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
}

// Create a connection pool for better performance
const pool = new Pool(dbConfig)

// Database utility functions
class Database {
  constructor() {
    this.pool = pool
  }

  // Execute a query with parameters
  async query(text, params = []) {
    const start = Date.now()
    try {
      const res = await this.pool.query(text, params)
      const duration = Date.now() - start
      console.log('Executed query', { text, duration, rows: res.rowCount })
      return res
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  // Get a client from the pool for transactions
  async getClient() {
    return await this.pool.connect()
  }

  // Close the connection pool
  async close() {
    await this.pool.end()
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW()')
      return { status: 'healthy', timestamp: result.rows[0].now }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

// Create a singleton instance
const db = new Database()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...')
  await db.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...')
  await db.close()
  process.exit(0)
})

export default db
