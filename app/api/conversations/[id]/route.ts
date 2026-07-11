import {
  requireSession,
  assertCanWrite,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'

// PATCH: mark read / transfer to human / send message
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const db = getDb()
    const conv = db.conversations.find((c) => c.id === id)
    if (!conv) throw new ApiError(404, 'Диалог не найден')
    assertTenant(session, conv.companyId)

    const body = (await req.json()) as {
      markRead?: boolean
      transferToHuman?: boolean
      message?: string
    }

    // Reading is allowed for all roles including viewer.
    if (body.markRead) {
      conv.unread = 0
    }

    if (body.transferToHuman) {
      assertCanWrite(session)
      conv.handledBy = 'human'
      conv.assigneeId = session.id
      db.events.unshift({
        id: uid('e'),
        companyId: conv.companyId,
        actorId: session.id,
        byAi: false,
        text: `${session.name} принял(а) диалог от AI-ассистента`,
        entity: 'conversation',
        entityId: conv.id,
        at: new Date().toISOString(),
      })
    }

    if (typeof body.message === 'string' && body.message.trim()) {
      assertCanWrite(session)
      conv.messages.push({
        id: uid('m'),
        from: 'manager',
        authorId: session.id,
        text: body.message.trim(),
        at: new Date().toISOString(),
        status: 'sent',
      })
      conv.handledBy = 'human'
      conv.assigneeId = session.id
      conv.updatedAt = new Date().toISOString()
    }

    return Response.json(conv)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
