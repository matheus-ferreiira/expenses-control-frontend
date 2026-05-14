export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1, 0, 0, 0, 0)
}

export function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}

export function startOfWeek(date: Date, weekStartsOn = 0): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfWeek(date: Date, weekStartsOn = 0): Date {
  const start = startOfWeek(date, weekStartsOn)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function formatMonthYear(date: Date, locale = 'pt-BR'): string {
  const s = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDayNumber(date: Date): number {
  return date.getDate()
}

/** Returns ISO date string YYYY-MM-DD for use as cache key */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Returns cache key for a month: 'YYYY-MM' */
export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/** Checks if a CalendarEvent (with start_date/end_date ISO strings) intersects a given day */
export function eventIntersectsDay(
  startDateStr: string,
  endDateStr: string,
  day: Date,
): boolean {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(day)
  dayEnd.setHours(23, 59, 59, 999)
  const evStart = new Date(startDateStr)
  const evEnd = new Date(endDateStr)
  return evStart <= dayEnd && evEnd >= dayStart
}
