import { requireSession, assertCanWrite, apiErrorResponse } from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import type { Deal, DealStage, LeadSource } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const body = (await req.json()) as Partial<Deal>

    if (!body.title?.trim()) {
      return Response.json({ error: 'Укажите название сделки' }, { status: 400 })
    }
    const amount = Number(body.amountKzt)
    if (!Number.isFinite(amount) || amount < 0) {
      return Response.json({ error: 'Некорректная сумма' }, { status: 400 })
    }

    const db = getDb()
    const cid = session.activeCompanyId
    const contact = body.contactId
      ? db.contacts.find((c) => c.id === body.contactId && c.companyId === cid)
      : null

    const deal: Deal = {
      id: uid('d'),
      companyId: cid,
      title: body.title.trim(),
      clientCompanyId: contact?.clientCompanyId ?? null,
      contactId: contact?.id ?? null,
      amountKzt: amount,
      stage: (body.stage as DealStage) || 'new',
      ownerId:
        body.ownerId && db.users.some((u) => u.id === body.ownerId && u.companyId === cid)
          ? body.ownerId
          : session.id,
      source: (body.source as LeadSource) || 'Сайт',
      probability: typeof body.probability === 'number' ? body.probability : 20,
      nextActionAt: body.nextActionAt ?? null,
      nextActionText: body.nextActionText ?? null,
      closeDate: body.closeDate ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      aiCreated: false,
      lostReason: null,
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    db.deals.unshift(deal)
    db.events.unshift({
      id: uid('e'),
      companyId: cid,
      actorId: session.id,
      byAi: false,
      text: `${session.name} создал(а) сделку «${deal.title}»`,
      entity: 'deal',
      entityId: deal.id,
      at: new Date().toISOString(),
    })

    return Response.json(deal, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
