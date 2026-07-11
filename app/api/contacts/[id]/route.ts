import {
  requireSession,
  assertCanWrite,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getDb } from '@/lib/server/store'
import type { Contact } from '@/lib/types'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const { id } = await params
    const db = getDb()
    const contact = db.contacts.find((c) => c.id === id)
    if (!contact) throw new ApiError(404, 'Контакт не найден')
    assertTenant(session, contact.companyId)

    const body = (await req.json()) as Partial<Contact>
    if (typeof body.name === 'string' && body.name.trim()) contact.name = body.name.trim()
    if (typeof body.phone === 'string' && body.phone.trim()) contact.phone = body.phone.trim()
    if (typeof body.email === 'string') contact.email = body.email.trim()
    if ('whatsapp' in body) contact.whatsapp = body.whatsapp ?? null
    if ('telegram' in body) contact.telegram = body.telegram ?? null
    if ('instagram' in body) contact.instagram = body.instagram ?? null
    if (typeof body.position === 'string') contact.position = body.position.trim()
    if (typeof body.consent === 'boolean') contact.consent = body.consent
    if (Array.isArray(body.tags)) contact.tags = body.tags
    if (
      'clientCompanyId' in body &&
      (body.clientCompanyId === null ||
        db.clientCompanies.some(
          (c) => c.id === body.clientCompanyId && c.companyId === contact.companyId,
        ))
    ) {
      contact.clientCompanyId = body.clientCompanyId ?? null
    }

    return Response.json(contact)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
