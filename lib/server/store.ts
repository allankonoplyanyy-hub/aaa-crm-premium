import { hasDatabase } from './db'
import { MemoryRepository } from './memory-repo'
import { PgRepository } from './pg-repo'
import type { Repository } from './repository'

export type { Repository } from './repository'

// Backend selection:
//  - DATABASE_URL present  → PostgreSQL (always; demo seed applied when empty and DEMO_MODE allows)
//  - no DATABASE_URL, dev  → in-memory demo repository
//  - no DATABASE_URL, prod → hard failure. No in-memory production fallback.

const globalStore = globalThis as unknown as {
  __aaaCrmRepo?: Repository
  __aaaCrmRepoInit?: Promise<Repository>
}

async function initRepo(): Promise<Repository> {
  if (hasDatabase()) {
    const repo = new PgRepository()
    if (process.env.DEMO_MODE !== 'false') {
      await repo.seedIfEmpty()
    }
    return repo
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is required in production. In-memory storage is only allowed in development/demo.',
    )
  }
  return new MemoryRepository()
}

export async function getRepo(): Promise<Repository> {
  if (globalStore.__aaaCrmRepo) return globalStore.__aaaCrmRepo
  if (!globalStore.__aaaCrmRepoInit) {
    globalStore.__aaaCrmRepoInit = initRepo().then((repo) => {
      globalStore.__aaaCrmRepo = repo
      return repo
    })
    // Allow retry after a failed init (e.g. transient DB outage at boot).
    globalStore.__aaaCrmRepoInit.catch(() => {
      globalStore.__aaaCrmRepoInit = undefined
    })
  }
  return globalStore.__aaaCrmRepoInit
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}
