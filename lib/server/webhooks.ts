import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { ApiError } from './auth'
import { getRepo } from './store'
import type { Integration } from '@/lib/types'

// Integration API v1 authentication:
//   X-AAA-Company:   tenant id
//   X-AAA-Timestamp: unix seconds (rejected when older than 5 minutes)
//   X-AAA-Signature: hex HMAC-SHA256 of `${timestamp}.${rawBody}` with the tenant's webhook secret
// Secret source: INTEGRATION_WEBHOOK_SECRET env (global demo secret) — per-tenant
// secrets are a production follow-up documented in CODEX_HANDOFF.md.

const MAX_SKEW_SEC = 5 * 60

export interface VerifiedWebhook {
  companyId: string
  rawBody: string
  payloadHash: string
}

export async function verifyWebhook(req: Request): Promise<VerifiedWebhook> {
  const secret = process.env.INTEGRATION_WEBHOOK_SECRET
  if (!secret) {
    throw new ApiError(503, 'Интеграционный API не настроен (INTEGRATION_WEBHOOK_SECRET)')
  }

  const companyId = req.headers.get('x-aaa-company')
  const timestamp = req.headers.get('x-aaa-timestamp')
  const signature = req.headers.get('x-aaa-signature')
  if (!companyId || !timestamp || !signature) {
    throw new ApiError(401, 'Отсутствуют заголовки аутентификации')
  }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SEC) {
    throw new ApiError(401, 'Метка времени вне допустимого окна')
  }

  const repo = await getRepo()
  const tenant = await repo.tenants.byId(companyId)
  if (!tenant) throw new ApiError(401, 'Неизвестная компания')

  const rawBody = await req.text()
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError(401, 'Неверная подпись')
  }

  return {
    companyId,
    rawBody,
    payloadHash: createHash('sha256').update(rawBody).digest('hex'),
  }
}

/** Marks the integration as active after a successful inbound event. */
export async function touchIntegration(companyId: string, name: string): Promise<void> {
  const repo = await getRepo()
  const integrations = await repo.integrations.listByCompany(companyId)
  const target: Integration | undefined = integrations.find((i) => i.name === name)
  if (target) {
    target.status = 'connected'
    target.lastEventAt = new Date().toISOString()
    await repo.integrations.update(target)
  }
}
