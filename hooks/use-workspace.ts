'use client'

import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { WorkspaceData } from '@/lib/types'

export function useWorkspace() {
  const { data, error, isLoading, mutate } = useSWR<WorkspaceData>(
    '/api/workspace',
    (url: string) => apiFetch<WorkspaceData>(url),
    { revalidateOnFocus: false },
  )
  return { data, error, isLoading, mutate }
}

export function canWrite(role: string | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager'
}
