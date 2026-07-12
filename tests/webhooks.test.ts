import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'

// verifyWebhook depends on the repo (tenant lookup) and env secret.
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}))

const SECRET = 'test-secret'

function sign(ts: string, body: string): string {
  return createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex')
}

function makeReq(headers: Record<string, string>, body: string): Request {
  return new Request('http://localhost/api/v1/leads', {
    method: 'POST',
    headers,
    body,
  })
}

describe('verifyWebhook (integration API v1 auth)', () => {
  beforeEach(() => {
    vi.stubEnv('INTEGRATION_WEBHOOK_SECRET', SECRET)
    // Force the in-memory repo so tests never touch the real database.
    vi.stubEnv('DATABASE_URL', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts a correctly signed request for an existing tenant', async () => {
    const { verifyWebhook } = await import('@/lib/server/webhooks')
    const body = JSON.stringify({ event_id: 'e1', name: 'Тест', phone: '+7700' })
    const ts = Math.floor(Date.now() / 1000).toString()
    const req = makeReq(
      { 'x-aaa-company': 't1', 'x-aaa-timestamp': ts, 'x-aaa-signature': sign(ts, body) },
      body,
    )
    const verified = await verifyWebhook(req)
    expect(verified.companyId).toBe('t1')
    expect(verified.rawBody).toBe(body)
    expect(verified.payloadHash).toHaveLength(64)
  })

  it('rejects a request with a wrong signature', async () => {
    const { verifyWebhook } = await import('@/lib/server/webhooks')
    const body = '{}'
    const ts = Math.floor(Date.now() / 1000).toString()
    const req = makeReq(
      { 'x-aaa-company': 't1', 'x-aaa-timestamp': ts, 'x-aaa-signature': 'deadbeef' },
      body,
    )
    await expect(verifyWebhook(req)).rejects.toMatchObject({ status: 401 })
  })

  it('rejects a stale timestamp (replay window)', async () => {
    const { verifyWebhook } = await import('@/lib/server/webhooks')
    const body = '{}'
    const ts = Math.floor(Date.now() / 1000 - 3600).toString()
    const req = makeReq(
      { 'x-aaa-company': 't1', 'x-aaa-timestamp': ts, 'x-aaa-signature': sign(ts, body) },
      body,
    )
    await expect(verifyWebhook(req)).rejects.toMatchObject({ status: 401 })
  })

  it('rejects an unknown tenant', async () => {
    const { verifyWebhook } = await import('@/lib/server/webhooks')
    const body = '{}'
    const ts = Math.floor(Date.now() / 1000).toString()
    const req = makeReq(
      { 'x-aaa-company': 'nope', 'x-aaa-timestamp': ts, 'x-aaa-signature': sign(ts, body) },
      body,
    )
    await expect(verifyWebhook(req)).rejects.toMatchObject({ status: 401 })
  })

  it('rejects when headers are missing', async () => {
    const { verifyWebhook } = await import('@/lib/server/webhooks')
    const req = makeReq({}, '{}')
    await expect(verifyWebhook(req)).rejects.toMatchObject({ status: 401 })
  })
})

describe('password hashing (scrypt)', () => {
  it('hashes and verifies a password', async () => {
    const { hashPassword, verifyPassword } = await import('@/lib/server/passwords')
    const hash = await hashPassword('s3cret-Пароль')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('s3cret-Пароль', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('produces unique salts', async () => {
    const { hashPassword } = await import('@/lib/server/passwords')
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')])
    expect(a).not.toBe(b)
  })
})
