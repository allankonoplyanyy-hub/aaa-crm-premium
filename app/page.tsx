import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'AAA CRM — AI-платформа продаж для бизнеса',
  description:
    'CRM с AI-менеджерами: омниканальный inbox, Voice AI, воронка продаж и аналитика. Запуск за один день. Попробуйте бесплатно.',
}

export default function HomePage() {
  return <LandingPage />
}
