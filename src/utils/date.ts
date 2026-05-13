const LOCALE = 'pt-BR'

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, options ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
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

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0] ?? ''
}

export function today(): string {
  return toISODate(new Date())
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date() && toISODate(new Date(dueDate)) !== today()
}

export function isToday(date: string): boolean {
  return toISODate(new Date(date)) === today()
}

export function isTomorrow(date: string): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return toISODate(new Date(date)) === toISODate(tomorrow)
}

export function weekdayName(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, { weekday: 'long' })
}

export function monthName(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}
