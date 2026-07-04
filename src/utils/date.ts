const LOCALE = 'pt-BR'

/**
 * Parse seguro: string date-only ("2026-07-04") é interpretada como data LOCAL.
 * `new Date('YYYY-MM-DD')` é UTC-midnight — em UTC-3 vira o dia anterior.
 */
function parseDate(date: string | Date): Date {
  if (date instanceof Date) return date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T12:00:00')
  return new Date(date)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return parseDate(date).toLocaleDateString(LOCALE, options ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  return parseDate(date).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(date: string | Date): string {
  const d = parseDate(date)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  if (diffDays === -1) return 'Ontem'
  if (diffDays > 1 && diffDays < 7) return `Em ${diffDays} dias`
  if (diffDays < -1 && diffDays > -7) return `Há ${Math.abs(diffDays)} dias`

  return formatDate(d)
}

/** Data LOCAL em YYYY-MM-DD (nunca toISOString — o dia UTC vira às 21h de Brasília) */
export function toISODate(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

export function today(): string {
  return toISODate(new Date())
}

export function isOverdue(dueDate: string): boolean {
  return dueDate.slice(0, 10) < today()
}

export function isToday(date: string): boolean {
  return date.slice(0, 10) === today()
}

export function isTomorrow(date: string): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.slice(0, 10) === toISODate(tomorrow)
}

export function weekdayName(date: string | Date): string {
  return parseDate(date).toLocaleDateString(LOCALE, { weekday: 'long' })
}

export function monthName(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}
