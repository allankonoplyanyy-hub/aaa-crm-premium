import { requireSession, assertCanWrite, apiErrorResponse } from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import type { ClientCompany } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const body = (await req.json()) as Partial<ClientCompany>

    if (!body.name?.trim()) {
      return Response.json({ error: 'Укажите название компании' }, { status: 400 })
    }

    const db = getDb()
    const company: ClientCompany = {
      id: uid('kc'),
      companyId: session.activeCompanyId,
      name: body.name.trim(),
      bin: body.bin?.trim() ?? '',
      niche: body.niche?.trim() ?? '',
      size: body.size?.trim() ?? '1-10',
      website: body.website?.trim() ?? '',
      address: body.address?.trim() ?? '',
      ownerId: session.id,
      createdAt: new Date().toISOString(),
    }

    db.clientCompanies.unshift(company)
    return Response.json(company, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
