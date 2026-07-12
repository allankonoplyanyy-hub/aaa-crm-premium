// Applies db/migrations/*.sql in order, tracking progress in schema_migrations.
// Usage: node --env-file-if-exists=.env.development.local scripts/migrate.mjs
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: url, max: 1 })
const dir = join(process.cwd(), 'db', 'migrations')

async function main() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  )
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
  const { rows } = await pool.query('SELECT version FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.version))

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip    ${file}`)
      continue
    }
    const sql = await readFile(join(dir, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`applied ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`FAILED  ${file}:`, err.message)
      process.exit(1)
    } finally {
      client.release()
    }
  }
  console.log('migrations complete')
}

main().finally(() => pool.end())
