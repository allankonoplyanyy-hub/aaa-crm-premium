import {
  requireSession,
  assertCanWrite,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const { id } = await params
    const db = getDb()
    const assistant = db.assistants.find((a) => a.id === id)
    if (!assistant) throw new ApiError(404, 'Ассистент не найден')
    assertTenant(session, assistant.companyId)

    const body = (await req.json()) as { active?: boolean }
    if (typeof body.active === 'boolean') {
      assistant.active = body.active
      db.events.unshift({
        id: uid('e'),
        companyId: assistant.companyId,
        actorId: session.id,
        byAi: false,
        text: `${session.name} ${body.active ? 'запустил(а)' : 'приостановил(а)'} AI-ассистента «${assistant.name}»`,
        entity: 'system',
        entityId: assistant.id,
        at: new Date().toISOString(),
      })
    }

    return Response.json(assistant)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
