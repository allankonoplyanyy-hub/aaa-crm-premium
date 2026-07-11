import { requireSession, apiErrorResponse } from '@/lib/server/auth'
import { getDb } from '@/lib/server/store'
import type { WorkspaceData } from '@/lib/types'

export async function GET() {
  try {
    const session = await requireSession()
    const db = getDb()
    const cid = session.activeCompanyId

    const data: WorkspaceData = {
      session,
      // Owner sees all tenants (for switching + CEO panel); others only their own.
      tenants:
        session.role === 'owner' ? db.tenants : db.tenants.filter((t) => t.id === cid),
      users:
        session.role === 'owner'
          ? db.users
          : db.users.filter((u) => u.companyId === cid),
      deals: db.deals.filter((d) => d.companyId === cid),
      contacts: db.contacts.filter((c) => c.companyId === cid),
      clientCompanies: db.clientCompanies.filter((c) => c.companyId === cid),
      tasks: db.tasks.filter((t) => t.companyId === cid),
      conversations: db.conversations.filter((c) => c.companyId === cid),
      calls: db.calls.filter((c) => c.companyId === cid),
      knowledgeDocs: db.knowledgeDocs.filter((k) => k.companyId === cid),
      integrations: db.integrations.filter((i) => i.companyId === cid),
      events: db.events.filter((e) => e.companyId === cid),
      assistants: db.assistants.filter((a) => a.companyId === cid),
    }

    return Response.json(data)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
