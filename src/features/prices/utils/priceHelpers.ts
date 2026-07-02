/** Formats a YYYY-MM-DD string as dd/mm/aaaa, parsing as local time (no UTC shift). */
export function formatDay(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/** Formats a YYYY-MM-DD string as dd/mm (short). */
export function formatDayShort(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parts[2]}/${parts[1]}`
}

/** Today as YYYY-MM-DD in local time. */
export function todayISO(): string {
  return new Date().toLocaleDateString('en-CA')
}

/** A date N days before today, as YYYY-MM-DD in local time. */
export function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('en-CA')
}

/** Chart series color tokens — resolved at runtime via CSS vars (same approach as FinanceCashflowChart). */
export const PRICE_CHART_TOKENS = [
  '--chart-1',
  '--chart-3',
  '--chart-4',
  '--chart-2',
  '--chart-5',
] as const
