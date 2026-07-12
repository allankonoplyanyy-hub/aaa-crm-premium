import { Pool } from 'pg'

// Single shared pg Pool (reused across HMR reloads in dev).
const globalPg = globalThis as unknown as { __aaaPgPool?: Pool }

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!globalPg.__aaaPgPool) {
    globalPg.__aaaPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    })
  }
  return globalPg.__aaaPgPool
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL)
}
