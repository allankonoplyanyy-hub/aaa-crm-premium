import { requireSession, assertOwner, setActiveCompany, apiErrorResponse } from '@/lib/server/auth'
import { getDb } from '@/lib/server/store'

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertOwner(session)
    const { companyId } = (await req.json()) as { companyId?: string }
    const tenant = getDb().tenants.find((t) => t.id === companyId)
    if (!tenant) {
      return Response.json({ error: 'Компания не найдена' }, { status: 404 })
    }
    await setActiveCompany(tenant.id)
    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
