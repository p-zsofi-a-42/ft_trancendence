import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// Without this, an idle connection dropped by a database restart crashes the process.
pool.on('error', (err) => {
  console.error('idle postgres client error', err)
})

export const db = drizzle(pool, { schema })
