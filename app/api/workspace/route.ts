import { requireSession, apiErrorResponse } from '@/lib/server/auth'
import { getRepo } from '@/lib/server/store'
import type { WorkspaceData } from '@/lib/types'

export async function GET() {
  try {
    const session = await requireSession()
    const repo = await getRepo()
    const cid = session.activeCompanyId

    const [
      tenants,
      users,
      deals,
      contacts,
      clientCompanies,
      tasks,
      conversations,
      calls,
      knowledgeDocs,
      integrations,
      events,
      assistants,
    ] = await Promise.all([
      // Owner sees all tenants (for switching + CEO panel); others only their own.
      session.role === 'owner'
        ? repo.tenants.listAll()
        : repo.tenants.byId(cid).then((t) => (t ? [t] : [])),
      session.role === 'owner' ? repo.users.listAll() : repo.users.listByCompany(cid),
      repo.deals.listByCompany(cid),
      repo.contacts.listByCompany(cid),
      repo.clientCompanies.listByCompany(cid),
      repo.tasks.listByCompany(cid),
      repo.conversations.listByCompany(cid),
      repo.calls.listByCompany(cid),
      repo.knowledgeDocs.listByCompany(cid),
      repo.integrations.listByCompany(cid),
      repo.events.listByCompany(cid),
      repo.assistants.listByCompany(cid),
    ])

    // Never expose password hashes to the client.
    const safeUsers = users.map(({ passwordHash: _ph, ...u }) => u)

    const data: WorkspaceData = {
      session,
      tenants,
      users: safeUsers as WorkspaceData['users'],
      deals,
      contacts,
      clientCompanies,
      tasks,
      conversations,
      calls,
      knowledgeDocs,
      integrations,
      events,
      assistants,
    }

    return Response.json(data)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
