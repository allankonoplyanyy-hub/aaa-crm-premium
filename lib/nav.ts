import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Building2,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Phone,
  Bot,
  BarChart3,
  BookOpen,
  Plug,
  UsersRound,
  Crown,
  Settings,
} from 'lucide-react'
import type { Role } from '@/lib/types'

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  roles?: Role[] // undefined = all roles
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Продажи',
    items: [
      { title: 'Обзор', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Сделки', url: '/pipeline', icon: KanbanSquare },
      { title: 'Контакты', url: '/contacts', icon: Users },
      { title: 'Компании', url: '/companies', icon: Building2 },
      { title: 'Задачи', url: '/tasks', icon: CheckSquare },
      { title: 'Календарь', url: '/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Коммуникации',
    items: [
      { title: 'Диалоги', url: '/inbox', icon: MessageSquare },
      { title: 'Звонки', url: '/calls', icon: Phone },
      { title: 'AI-менеджеры', url: '/ai', icon: Bot },
      { title: 'База знаний', url: '/knowledge', icon: BookOpen },
    ],
  },
  {
    label: 'Управление',
    items: [
      { title: 'Отчёты', url: '/reports', icon: BarChart3 },
      { title: 'Команда', url: '/team', icon: UsersRound, roles: ['owner', 'admin'] },
      { title: 'CEO-панель', url: '/ceo', icon: Crown, roles: ['owner'] },
      { title: 'Интеграции', url: '/integrations', icon: Plug, roles: ['owner', 'admin'] },
      { title: 'Настройки', url: '/settings', icon: Settings },
    ],
  },
]

export function visibleSections(role: Role): NavSection[] {
  return NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((s) => s.items.length > 0)
}

export function pageTitle(pathname: string): string {
  for (const s of NAV_SECTIONS) {
    for (const i of s.items) {
      if (i.url === pathname) return i.title
    }
  }
  return 'AAA CRM'
}
