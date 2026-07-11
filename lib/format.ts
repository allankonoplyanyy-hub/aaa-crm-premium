const kztFormatter = new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 0 })

export function formatKzt(amount: number): string {
  return `${kztFormatter.format(amount)} ₸`
}

export function formatKztShort(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)} млн ₸`
  }
  if (amount >= 1_000) return `${Math.round(amount / 1000)} тыс ₸`
  return `${kztFormatter.format(amount)} ₸`
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const fullDateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso))
}

export function formatFullDate(iso: string): string {
  return fullDateFmt.format(new Date(iso))
}

export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  )
}

export function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now() && !isToday(iso)
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} ч назад`
  const daysAgo = Math.floor(hours / 24)
  if (daysAgo === 1) return 'вчера'
  if (daysAgo < 7) return `${daysAgo} дн назад`
  return formatDate(iso)
}

export function formatDuration(sec: number): string {
  if (sec === 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m} мин ${s} с` : `${s} с`
}
