import { createHmac, timingSafeEqual } from 'node:crypto'
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

// ---------------------------------------------------------------------------
// Service-to-service HMAC auth for the v1 integration API.
// Signature: hex(hmac_sha256(secret, `${timestamp}.${rawBody}`))
// ---------------------------------------------------------------------------

const MAX_SKEW_MS = 5 * 60 * 1000

export function verifyHmac(rawBody: string, timestamp: string | null, signature: string | null): void {
  const secret = process.env.INTEGRATION_SIGNING_SECRET
  if (!secret) {
    throw new ApiError(503, 'Интеграционный API не настроен (INTEGRATION_SIGNING_SECRET)')
  }
  if (!timestamp || !signature) {
    throw new ApiError(401, 'Отсутствует подпись запроса')
  }
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) {
    throw new ApiError(401, 'Метка времени запроса вне допустимого окна')
  }
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError(401, 'Неверная подпись запроса')
  }
}
