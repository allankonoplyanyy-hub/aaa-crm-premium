import { requireSession, assertCanWrite, apiErrorResponse } from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import type { Contact, LeadSource } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const body = (await req.json()) as Partial<Contact>

    if (!body.name?.trim()) {
      return Response.json({ error: 'Укажите имя контакта' }, { status: 400 })
    }
    if (!body.phone?.trim()) {
      return Response.json({ error: 'Укажите телефон' }, { status: 400 })
    }

    const db = getDb()
    const cid = session.activeCompanyId

    const contact: Contact = {
      id: uid('c'),
      companyId: cid,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() ?? '',
      whatsapp: body.whatsapp ?? null,
      telegram: body.telegram ?? null,
      instagram: body.instagram ?? null,
      clientCompanyId:
        body.clientCompanyId &&
        db.clientCompanies.some((c) => c.id === body.clientCompanyId && c.companyId === cid)
          ? body.clientCompanyId
          : null,
      position: body.position?.trim() ?? '',
      source: (body.source as LeadSource) || 'Сайт',
      ownerId: session.id,
      tags: Array.isArray(body.tags) ? body.tags : [],
      consent: body.consent !== false,
      createdAt: new Date().toISOString(),
    }

    db.contacts.unshift(contact)
    db.events.unshift({
      id: uid('e'),
      companyId: cid,
      actorId: session.id,
      byAi: false,
      text: `${session.name} добавил(а) контакт «${contact.name}»`,
      entity: 'contact',
      entityId: contact.id,
      at: new Date().toISOString(),
    })

    return Response.json(contact, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
