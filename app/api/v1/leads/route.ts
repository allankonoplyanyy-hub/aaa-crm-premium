import { z } from 'zod'
import { apiErrorResponse } from '@/lib/server/auth'
import { getRepo, uid } from '@/lib/server/store'
import { verifyWebhook, touchIntegration } from '@/lib/server/webhooks'
import type { Contact, Deal, LeadSource } from '@/lib/types'

// POST /api/v1/leads — inbound lead from an external channel (site form,
// messenger bot, telephony). HMAC-authenticated, idempotent by event_id.

const LEAD_SOURCES = ['Сайт', 'Instagram', 'WhatsApp', 'Telegram', 'Звонок', 'Рекомендация', '2ГИС'] as const

const leadSchema = z.object({
  event_id: z.string().min(1).max(120),
  source: z.enum(LEAD_SOURCES).default('Сайт'),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().max(200).optional().default(''),
  message: z.string().max(2000).optional().default(''),
  amount_kzt: z.number().finite().min(0).max(1_000_000_000_000).optional().default(0),
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
    const parsed = leadSchema.safeParse(json)
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Некорректные данные' },
        { status: 400 },
      )
    }
    const body = parsed.data

    // Idempotency: replaying the same event_id returns the original result.
    const eventKey = `lead:${body.event_id}`
    const existing = await repo.integrationEvents.find(verified.companyId, eventKey)
    if (existing) {
      return Response.json({ ...(existing.result as object), idempotent_replay: true })
    }

    const nowIso = new Date().toISOString()
    const cid = verified.companyId

    // Reuse a contact with the same phone when possible.
    const contacts = await repo.contacts.listByCompany(cid)
    let contact = contacts.find((c) => c.phone.replace(/\D/g, '') === body.phone.replace(/\D/g, ''))
    if (!contact) {
      contact = {
        id: uid('c'),
        companyId: cid,
        name: body.name,
        phone: body.phone,
        email: body.email,
        whatsapp: null,
        telegram: null,
        instagram: null,
        clientCompanyId: null,
        position: '',
        source: body.source as LeadSource,
        ownerId: '',
        tags: ['api'],
        consent: true,
        createdAt: nowIso,
      } satisfies Contact
      await repo.contacts.insert(contact)
    }

    const deal: Deal = {
      id: uid('d'),
      companyId: cid,
      title: `Заявка: ${body.name}`,
      clientCompanyId: null,
      contactId: contact.id,
      amountKzt: body.amount_kzt,
      stage: 'new',
      ownerId: contact.ownerId || '',
      source: body.source as LeadSource,
      probability: 10,
      nextActionAt: null,
      nextActionText: body.message ? `Обращение: ${body.message.slice(0, 200)}` : null,
      closeDate: null,
      tags: ['api'],
      aiCreated: true,
      lostReason: null,
      notes: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    await repo.deals.insert(deal)

    await repo.events.insert({
      id: uid('e'),
      companyId: cid,
      actorId: null,
      byAi: true,
      text: `Новый лид из канала «${body.source}»: ${body.name}`,
      entity: 'deal',
      entityId: deal.id,
      at: nowIso,
    })
    await repo.audit({
      companyId: cid,
      actorId: null,
      action: 'lead.inbound',
      entity: 'deal',
      entityId: deal.id,
      meta: { source: body.source, event_id: body.event_id },
    })

    const result = { ok: true, deal_id: deal.id, contact_id: contact.id }
    await repo.integrationEvents.record(cid, {
      eventKey,
      source: body.source,
      payloadHash: verified.payloadHash,
      result,
    })
    await touchIntegration(cid, 'Веб-формы')

    return Response.json(result, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
