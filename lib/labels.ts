import type { Role } from '@/lib/types'

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Владелец платформы',
  admin: 'Администратор',
  manager: 'Менеджер',
  viewer: 'Наблюдатель',
}
