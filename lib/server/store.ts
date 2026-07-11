import { createSeed, SEED_VERSION, type Database } from './seed'

// Repository abstraction: swap DemoRepository for a PostgresRepository in production.
export interface Repository {
  db: Database
  reset(): void
}

class DemoRepository implements Repository {
  db: Database
  constructor() {
    this.db = createSeed()
  }
  reset() {
    this.db = createSeed()
  }
}

const globalStore = globalThis as unknown as {
  __aaaCrmRepo?: DemoRepository
  __aaaCrmSeedVersion?: number
}

export function getRepo(): Repository {
  if (!globalStore.__aaaCrmRepo || globalStore.__aaaCrmSeedVersion !== SEED_VERSION) {
    globalStore.__aaaCrmRepo = new DemoRepository()
    globalStore.__aaaCrmSeedVersion = SEED_VERSION
  }
  return globalStore.__aaaCrmRepo
}

export function getDb(): Database {
  return getRepo().db
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
