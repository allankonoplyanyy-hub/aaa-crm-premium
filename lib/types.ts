export type Role = 'owner' | 'admin' | 'manager' | 'viewer'

export interface User {
  id: string
  companyId: string // home tenant; owner sees all
  name: string
  email: string
  role: Role
  title: string
  avatarInitials: string
  active: boolean
  // SHA-256 hash for self-registered users; seed users fall back to the demo password.
  passwordHash?: string
}

export interface Tenant {
  id: string
  name: string
  bin: string
  niche: string
  city: string
  plan: 'Старт' | 'Бизнес' | 'Премиум'
  status: 'active' | 'suspended'
  aiSpendKzt: number
  aiLimitKzt: number
  createdAt: string
}

export type DealStage =
  | 'new'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'approval'
  | 'won'
  | 'lost'

export const STAGE_ORDER: DealStage[] = [
  'new',
  'qualification',
  'proposal',
  'negotiation',
  'approval',
  'won',
  'lost',
]

export const STAGE_LABELS: Record<DealStage, string> = {
  new: 'Новый лид',
  qualification: 'Квалификация',
  proposal: 'Предложение',
  negotiation: 'Переговоры',
  approval: 'Согласование',
  won: 'Выиграно',
  lost: 'Проиграно',
}

export type LeadSource =
  | 'Сайт'
  | 'Instagram'
  | 'WhatsApp'
  | 'Telegram'
  | 'Звонок'
  | 'Рекомендация'
  | '2ГИС'

export interface Deal {
  id: string
  companyId: string
  title: string
  clientCompanyId: string | null
  contactId: string | null
  amountKzt: number
  stage: DealStage
  ownerId: string
  source: LeadSource
  probability: number
  nextActionAt: string | null
  nextActionText: string | null
  closeDate: string | null
  tags: string[]
  aiCreated: boolean
  lostReason: string | null
  notes: DealNote[]
  createdAt: string
  updatedAt: string
}

export interface DealNote {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export interface Contact {
  id: string
  companyId: string
  name: string
  phone: string
  email: string
  whatsapp: string | null
  telegram: string | null
  instagram: string | null
  clientCompanyId: string | null
  position: string
  source: LeadSource
  ownerId: string
  tags: string[]
  consent: boolean
  createdAt: string
}

export interface ClientCompany {
  id: string
  companyId: string
  name: string
  bin: string
  niche: string
  size: string
  website: string
  address: string
  ownerId: string
  createdAt: string
}

export type TaskType = 'call' | 'meeting' | 'message' | 'proposal' | 'followup'

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  call: 'Звонок',
  meeting: 'Встреча',
  message: 'Сообщение',
  proposal: 'Подготовка предложения',
  followup: 'Follow-up',
}

export interface Task {
  id: string
  companyId: string
  title: string
  type: TaskType
  dueAt: string
  done: boolean
  assigneeId: string
  dealId: string | null
  contactId: string | null
  createdAt: string
}

export type Channel = 'telegram' | 'instagram' | 'whatsapp' | 'website' | 'email'

export const CHANNEL_LABELS: Record<Channel, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  website: 'Сайт',
  email: 'Email',
}

export interface Message {
  id: string
  from: 'client' | 'ai' | 'manager'
  authorId: string | null
  text: string
  at: string
  status: 'sent' | 'delivered' | 'read'
}

export interface Conversation {
  id: string
  companyId: string
  contactId: string
  channel: Channel
  handledBy: 'ai' | 'human'
  assigneeId: string | null
  unread: number
  messages: Message[]
  aiSummary: string
  updatedAt: string
}

export interface Call {
  id: string
  companyId: string
  direction: 'incoming' | 'outgoing'
  contactId: string | null
  phone: string
  durationSec: number
  result: string
  transcript: string
  aiSummary: string
  byAi: boolean
  dealId: string | null
  at: string
}

export interface KnowledgeDoc {
  id: string
  companyId: string
  title: string
  category: 'Документы' | 'FAQ' | 'Услуги' | 'Цены' | 'Правила' | 'Запрещённые ответы'
  content: string
  indexed: boolean
  assistant: string
  updatedAt: string
}

export type IntegrationStatus = 'connected' | 'setup_required' | 'error'

export interface Integration {
  id: string
  companyId: string
  name: string
  status: IntegrationStatus
  lastEventAt: string | null
  description: string
}

export interface ActivityEvent {
  id: string
  companyId: string
  actorId: string | null
  byAi: boolean
  text: string
  entity: 'deal' | 'contact' | 'task' | 'conversation' | 'call' | 'system'
  entityId: string | null
  at: string
}

export interface AiAssistant {
  id: string
  companyId: string
  name: string
  active: boolean
  handled: number
  leadsCreated: number
  transferred: number
  conversionPct: number
  avgResponseSec: number
  channels: Channel[]
  prompt: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  companyId: string
  activeCompanyId: string
  title: string
  avatarInitials: string
}

export interface WorkspaceData {
  session: SessionUser
  tenants: Tenant[]
  users: User[]
  deals: Deal[]
  contacts: Contact[]
  clientCompanies: ClientCompany[]
  tasks: Task[]
  conversations: Conversation[]
  calls: Call[]
  knowledgeDocs: KnowledgeDoc[]
  integrations: Integration[]
  events: ActivityEvent[]
  assistants: AiAssistant[]
}
