import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// auth.ts imports next/headers (server-only); mock the cookie jar so we can
// exercise assertCsrf with controlled cookie values.
const cookieJar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}))

import { assertCsrf, ApiError, CSRF_COOKIE, CSRF_HEADER } from '@/lib/server/auth'
import {
  checkRateLimit,
  clearAllRateLimits,
  clientIp,
  parsePageParams,
  paginate,
  MAX_PAGE_LIMIT,
  DEFAULT_PAGE_LIMIT,
} from '@/lib/server/security'
import { log } from '@/lib/server/log'

describe('rate limiting', () => {
  beforeEach(() => clearAllRateLimits())

  it('allows up to max attempts, then throws 429', () => {
    for (let i = 0; i < 5; i++) {
      expect(() => checkRateLimit('login:1.2.3.4', 5)).not.toThrow()
    }
    try {
      checkRateLimit('login:1.2.3.4', 5)
      expect.unreachable('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(429)
    }
  })

  it('isolates buckets per key (per IP / per email)', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('login:a', 5)
    expect(() => checkRateLimit('login:b', 5)).not.toThrow()
  })

  it('extracts client ip from x-forwarded-for', () => {
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' } })
    expect(clientIp(req)).toBe('9.9.9.9')
    expect(clientIp(new Request('http://x'))).toBe('local')
  })
})

describe('CSRF double-submit', () => {
  beforeEach(() => cookieJar.clear())

  function reqWithHeader(token?: string) {
    const headers: Record<string, string> = {}
    if (token !== undefined) headers[CSRF_HEADER] = token
    return new Request('http://x', { method: 'POST', headers })
  }

  it('passes when header matches cookie', async () => {
    cookieJar.set(CSRF_COOKIE, 'tok-123')
    await expect(assertCsrf(reqWithHeader('tok-123'))).resolves.toBeUndefined()
  })

  it('rejects when header is missing', async () => {
    cookieJar.set(CSRF_COOKIE, 'tok-123')
    await expect(assertCsrf(reqWithHeader())).rejects.toMatchObject({ status: 403 })
  })

  it('rejects when cookie is missing', async () => {
    await expect(assertCsrf(reqWithHeader('tok-123'))).rejects.toMatchObject({ status: 403 })
  })

  it('rejects when values differ', async () => {
    cookieJar.set(CSRF_COOKIE, 'tok-123')
    await expect(assertCsrf(reqWithHeader('tok-456'))).rejects.toMatchObject({ status: 403 })
  })
})

describe('pagination', () => {
  it('parses limit/offset with clamping', () => {
    expect(parsePageParams(new URL('http://x/api?limit=10&offset=5'))).toEqual({ limit: 10, offset: 5 })
    expect(parsePageParams(new URL('http://x/api'))).toEqual({ limit: DEFAULT_PAGE_LIMIT, offset: 0 })
    expect(parsePageParams(new URL('http://x/api?limit=99999')).limit).toBe(MAX_PAGE_LIMIT)
    expect(parsePageParams(new URL('http://x/api?limit=-5&offset=-2'))).toEqual({ limit: 1, offset: 0 })
    expect(parsePageParams(new URL('http://x/api?limit=abc'))).toEqual({ limit: DEFAULT_PAGE_LIMIT, offset: 0 })
  })

  it('slices items and reports total', () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ id: String(i) }))
    const page = paginate(items, { limit: 3, offset: 5 })
    expect(page.items.map((i) => i.id)).toEqual(['5', '6'])
    expect(page.total).toBe(7)
    expect(page.limit).toBe(3)
    expect(page.offset).toBe(5)
  })
})

describe('log redaction (secrets never reach logs)', () => {
  let lines: string[] = []
  beforeEach(() => {
    lines = []
    vi.spyOn(console, 'log').mockImplementation((l: string) => {
      lines.push(l)
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('redacts password, token, secret, signature fields at any depth', () => {
    log.info('login.attempt', {
      email: 'a@b.kz',
      password: 'super-secret-1',
      nested: { token: 'tok-abc', deep: { signature: 'sig-xyz', secret: 's3cret' } },
    })
    const out = lines.join('\n')
    expect(out).toContain('a@b.kz')
    expect(out).not.toContain('super-secret-1')
    expect(out).not.toContain('tok-abc')
    expect(out).not.toContain('sig-xyz')
    expect(out).not.toContain('s3cret')
    expect(out).toContain('[REDACTED]')
  })
})
