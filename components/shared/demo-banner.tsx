import { FlaskConical } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IS_DEMO } from '@/lib/demo'

export function DemoBanner({ text }: { text: string }) {
  if (!IS_DEMO) return null
  return (
    <Alert>
      <FlaskConical />
      <AlertTitle>Демо-режим</AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  )
}
