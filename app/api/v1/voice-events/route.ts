import { z } from 'zod'
import { apiErrorResponse } from '@/lib/server/auth'
import { getRepo, uid } from '@/lib/server/store'
import { verifyWebhook, touchIntegration } from '@/lib/server/webhooks'
import type { Call } from '@/lib/types'

// POST /api/v1/voice-events — Voice AI call summary from an external
// telephony/voice provider. HMAC-authenticated, idempotent by event_id.

const voiceEventSchema = z.object({
  event_id: z.string().min(1).max(120),
  direction: z.enum(['incoming', 'outgoing']).default('incoming'),
  phone: z.string().trim().min(1).max(40),
  duration_sec: z.number().int().min(0).max(60 * 60 * 6),
  result: z.string().trim().max(200).default('Разговор завершён'),
  transcript: z.string().max(20000).default(''),
  summary: z.string().max(2000).default(''),
  by_ai: z.boolean().default(true),
  occurred_at: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const verified = await verifyWebhook(req)
    const repo = await getRepo()

    let json: unknown
    try {
      json = JSON.parse(verified.rawBody)
    } catch {
      return Response.json({ error: 'Некорректный JSON' }, { status: 400 })
    }
    const parsed = voiceEventSchema.safeParse(json)
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 },
      )
    }
    const body = parsed.data

    const eventKey = `voice:${body.event_id}`
    const existing = await repo.integrationEvents.find(verified.companyId, eventKey)
    if (existing) {
      return Response.json({ ...(existing.result as object), idempotent_replay: true })
    }

    const cid = verified.companyId
    const at = body.occurred_at ?? new Date().toISOString()

    // Match contact by normalized phone.
    const contacts = await repo.contacts.listByCompany(cid)
    const contact = contacts.find(
      (c) => c.phone.replace(/\D/g, '') === body.phone.replace(/\D/g, ''),
    )

    const call: Call = {
      id: uid('cl'),
      companyId: cid,
      direction: body.direction,
      contactId: contact?.id ?? null,
      phone: body.phone,
      durationSec: body.duration_sec,
      result: body.result,
      transcript: body.transcript,
      aiSummary: body.summary,
      byAi: body.by_ai,
      dealId: null,
      at,
    }
    await repo.calls.insert(call)

    await repo.events.insert({
      id: uid('e'),
      companyId: cid,
      actorId: null,
      byAi: body.by_ai,
      text: `Voice AI: ${body.direction === 'incoming' ? 'входящий' : 'исходящий'} звонок ${body.phone} (${Math.round(body.duration_sec / 60)} мин)`,
      entity: 'call',
      entityId: call.id,
      at,
    })
    await repo.audit({
      companyId: cid,
      actorId: null,
      action: 'voice.inbound',
      entity: 'call',
      entityId: call.id,
      meta: { event_id: body.event_id },
    })

    const result = { ok: true, call_id: call.id, contact_id: contact?.id ?? null }
    await repo.integrationEvents.record(cid, {
      eventKey,
      source: 'voice',
      payloadHash: verified.payloadHash,
      result,
    })
    await touchIntegration(cid, 'Телефония')

    return Response.json(result, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
