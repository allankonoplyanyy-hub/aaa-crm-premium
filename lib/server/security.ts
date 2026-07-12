import { ApiError } from './auth'

// ---------------------------------------------------------------------------
// Login rate limiting.
// In-memory sliding window: sufficient for a single instance; swap for
// Redis/Postgres-based limiting when running multiple instances (documented).
// ---------------------------------------------------------------------------

interface Bucket {
  count: number
  resetAt: number
}

const globalRl = globalThis as unknown as { __aaaRateLimits?: Map<string, Bucket> }
function buckets(): Map<string, Bucket> {
  if (!globalRl.__aaaRateLimits) globalRl.__aaaRateLimits = new Map()
  return globalRl.__aaaRateLimits
}

const WINDOW_MS = 10 * 60 * 1000

export function checkRateLimit(key: string, max: number): void {
  const map = buckets()
  const now = Date.now()
  const bucket = map.get(key)
  if (!bucket || bucket.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  bucket.count += 1
  if (bucket.count > max) {
    throw new ApiError(429, 'Слишком много попыток. Повторите через несколько минут.')
  }
}

export function resetRateLimit(key: string): void {
  buckets().delete(key)
}

/** Test helper: clear all buckets. */
export function clearAllRateLimits(): void {
  buckets().clear()
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return fwd ? fwd.split(',')[0].trim() : 'local'
}

// HMAC auth for the v1 integration API lives in lib/server/webhooks.ts
// (verifyWebhook: INTEGRATION_WEBHOOK_SECRET, timestamp window, idempotency).

// ---------------------------------------------------------------------------
// Pagination: shared helper for list endpoints.
// ---------------------------------------------------------------------------

export interface PageParams {
  limit: number
  offset: number
}

export const DEFAULT_PAGE_LIMIT = 50
export const MAX_PAGE_LIMIT = 200

export function parsePageParams(url: URL): PageParams {
  const rawLimit = Number(url.searchParams.get('limit') ?? DEFAULT_PAGE_LIMIT)
  const rawOffset = Number(url.searchParams.get('offset') ?? 0)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_PAGE_LIMIT)
    : DEFAULT_PAGE_LIMIT
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0
  return { limit, offset }
}

export function paginate<T>(items: T[], { limit, offset }: PageParams) {
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
  }
}
