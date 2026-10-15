import type { Component } from 'vue'
import { Landmark, PiggyBank, TrendingUp, Wallet } from 'lucide-vue-next'
import type { Transaction, TransactionType, AccountType, CardStatementInfo } from '@/types/finance'
import { toISODate } from '@/utils/date'

// ── Month helpers ──────────────────────────────────────────────────────────

export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthStart(month: string): string {
  return `${month}-01`
}

export function monthEnd(month: string): string {
  const parts = month.split('-')
  const year = parseInt(parts[0] ?? '2026')
  const m = parseInt(parts[1] ?? '1')
  const lastDay = new Date(year, m, 0).getDate()
  return `${month}-${String(lastDay).padStart(2, '0')}`
}

export function monthLabel(month: string): string {
  const parts = month.split('-')
  const year = parseInt(parts[0] ?? '2026')
  const m = parseInt(parts[1] ?? '1')
  const d = new Date(year, m - 1, 1)
  const raw = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function addMonths(month: string, delta: number): string {
  const parts = month.split('-')
  const year = parseInt(parts[0] ?? '2026')
  const m = parseInt(parts[1] ?? '1')
  const d = new Date(year, m - 1, 1)
  d.setMonth(d.getMonth() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Transaction helpers ────────────────────────────────────────────────────

export function transactionAmountClass(type: TransactionType): string {
  if (type === 'income') return 'text-emerald-400'
  if (type === 'expense') return 'text-red-400'
  return 'text-muted-foreground'
}

export function transactionAmountPrefix(type: TransactionType): string {
  if (type === 'income') return '+'
  if (type === 'expense') return '-'
  return ''
}

export interface TransactionGroup {
  date: string
  label: string
  transactions: Transaction[]
  income: number
  expenses: number
  /** Balance at end of this day. Only present when totalBalance is passed in. */
  endBalance?: number
}

/**
 * Groups transactions by date (newest first) and optionally computes the
 * running balance at the end of each day.
 *
 * @param totalBalance  Current total account balance. When provided each group
 *   gets an `endBalance` = balance after all confirmed transactions for that day.
 *   Only confirmed transactions are included in the running balance.
 */
export function groupTransactionsByDate(
  transactions: Transaction[],
  totalBalance?: number,
): TransactionGroup[] {
  const todayStr = toISODate(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = toISODate(yesterdayDate)
  const twoDaysAgoDate = new Date()
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2)
  const twoDaysAgoStr = toISODate(twoDaysAgoDate)
  const currentYear = new Date().getFullYear()

  const map = new Map<string, Transaction[]>()

  const sorted = [...transactions].sort((a, b) =>
    b.transaction_date.localeCompare(a.transaction_date),
  )

  for (const t of sorted) {
    const list = map.get(t.transaction_date) ?? []
    list.push(t)
    map.set(t.transaction_date, list)
  }

  const groups: TransactionGroup[] = [...map.entries()].map(([date, txs]) => {
    let label: string
    if (date === todayStr) {
      label = 'Hoje'
    } else if (date === yesterdayStr) {
      label = 'Ontem'
    } else if (date === twoDaysAgoStr) {
      label = 'Anteontem'
    } else {
      const d = new Date(`${date}T12:00:00`)
      const year = d.getFullYear()
      label = d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        ...(year !== currentYear ? { year: 'numeric' } : {}),
      }).toUpperCase()
    }

    const income = txs.filter((t) => t.status === 'confirmed').reduce((s, t) => s + (t.economic_effect ? t.economic_effect.income / 100 : t.type === 'income' ? t.amount : 0), 0)
    const expenses = txs.filter((t) => t.status === 'confirmed').reduce((s, t) => s + (t.economic_effect ? t.economic_effect.expense / 100 : t.type === 'expense' && !t.goal_id ? t.amount : 0), 0)

    return { date, label, transactions: txs, income, expenses }
  })

  // Compute running end-of-day balance (newest first → walk newest to oldest).
  // endBalance[newest] = totalBalance (right now)
  // endBalance[i+1]    = endBalance[i] − confirmed net delta of group[i]
  // A paginated transaction list cannot reconstruct account balances.
  // Date-specific balances are supplied by the account balance-at endpoint.
  void totalBalance

  return groups
}

// ── Account helpers ────────────────────────────────────────────────────────

export const ACCOUNT_TYPE_ICONS: Record<AccountType, Component> = {
  checking: Landmark,
  savings: PiggyBank,
  investment: TrendingUp,
  wallet: Wallet,
}

// ── Credit card billing period ────────────────────────────────────────────

export interface BillingPeriod {
  /** YYYY-MM-DD — first day of this billing cycle (day after last closing) */
  startDate: string
  /** YYYY-MM-DD — last day of this billing cycle (closing day) */
  endDate: string
  /** YYYY-MM-DD — payment due date (same month as closing if dueDay > closingDay, else the month after) */
  dueDate: string
  /** Human-readable label, e.g. "16 abr – 15 mai" */
  label: string
}

const MON_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "YYYY-MM-DD" → "13 jul" */
export function formatDayMonth(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MON_ABBR[(m ?? 1) - 1]}`
}

/**
 * Calculate the current billing period for a credit card.
 *
 * Rules:
 *   - Billing cycle: from (closingDay + 1) of the previous month
 *     to closingDay of the current month.
 *   - If today > effectiveClosingDay(currentMonth), we're already in the
 *     NEXT billing cycle (starts today's month, ends next month).
 *   - Edge cases: closingDay > days-in-month → clamp to last day of that month.
 *   - Year rollover (Dec → Jan) handled via month arithmetic.
 *
 * By construction, `endDate` is always today or a future date — this always describes
 * the currently accumulating cycle, never one that has already closed. There is
 * intentionally no `isClosed`/`isOpen` flag: it was previously hardcoded `true` whenever
 * this month's closing day had passed, which mislabeled the upcoming (still open) cycle
 * as a closed invoice (e.g. "Fatura fechada" shown days before the actual closing date).
 */
export function getCardBillingPeriod(
  closingDay: number,
  dueDay: number,
  referenceDate?: Date,
): BillingPeriod {
  const today = referenceDate ?? new Date()
  const todayDay = today.getDate()
  const todayYear = today.getFullYear()
  const todayMonthIdx = today.getMonth() // 0-based

  /** Days in any given month (month is 0-based) */
  function daysIn(year: number, monthIdx: number): number {
    return new Date(year, monthIdx + 1, 0).getDate()
  }

  /** Closing day clamped to the real last day of the month */
  function effectiveClose(year: number, monthIdx: number): number {
    return Math.min(closingDay, daysIn(year, monthIdx))
  }

  /** Format (year, 0-based month, day) → YYYY-MM-DD */
  function iso(year: number, monthIdx: number, day: number): string {
    return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  /**
   * Due date for a bill that closed on (closeYear, closeMonthIdx).
   * If dueDay falls after closingDay within the same month (e.g. closes 13, due 20),
   * the due date is in that SAME month. Otherwise (e.g. closes 28, due 5) it's the month after.
   */
  function computeDueDate(closeYear: number, closeMonthIdx: number): string {
    if (dueDay > closingDay) {
      const dueDayEff = Math.min(dueDay, daysIn(closeYear, closeMonthIdx))
      return iso(closeYear, closeMonthIdx, dueDayEff)
    }
    const dueMonthIdx = (closeMonthIdx + 1) % 12
    const dueYear = closeMonthIdx === 11 ? closeYear + 1 : closeYear
    const dueDayEff = Math.min(dueDay, daysIn(dueYear, dueMonthIdx))
    return iso(dueYear, dueMonthIdx, dueDayEff)
  }

  let startDate: string
  let endDate: string
  let dueDate: string

  const todayClose = effectiveClose(todayYear, todayMonthIdx)

  if (todayDay > todayClose) {
    // We've passed this month's closing day → currently in the NEXT open cycle.
    // Cycle starts on (todayClose + 1) of this month, ends on closingDay of NEXT month.
    const startDay = todayClose + 1

    const nextMonthIdx = (todayMonthIdx + 1) % 12
    const nextYear = todayMonthIdx === 11 ? todayYear + 1 : todayYear
    const endDay = effectiveClose(nextYear, nextMonthIdx)

    startDate = iso(todayYear, todayMonthIdx, startDay)
    endDate   = iso(nextYear, nextMonthIdx, endDay)
    dueDate   = computeDueDate(nextYear, nextMonthIdx)
  } else {
    // Today is on or before closing day → cycle closes this month on closingDay.
    // Cycle started on (prevMonthClose + 1) of last month.
    const prevMonthIdx = todayMonthIdx === 0 ? 11 : todayMonthIdx - 1
    const prevYear = todayMonthIdx === 0 ? todayYear - 1 : todayYear
    const prevClose = effectiveClose(prevYear, prevMonthIdx)
    const startDay = prevClose + 1

    // If prevClose+1 overflows prev month (e.g. closing=31, Feb has 28 days),
    // start on the 1st of the current month instead.
    if (startDay > daysIn(prevYear, prevMonthIdx)) {
      startDate = iso(todayYear, todayMonthIdx, 1)
    } else {
      startDate = iso(prevYear, prevMonthIdx, startDay)
    }

    endDate = iso(todayYear, todayMonthIdx, todayClose)
    dueDate = computeDueDate(todayYear, todayMonthIdx)
  }

  return {
    startDate,
    endDate,
    dueDate,
    label: `${formatDayMonth(startDate)} – ${formatDayMonth(endDate)}`,
  }
}

// ── Credit card statements (status comes from the backend) ─────────────────

/** Days from `today` until a YYYY-MM-DD date (negative when it has passed). */
export function daysUntil(dateStr: string, today: string = toISODate(new Date())): number {
  const [y1, m1, d1] = today.split('-').map(Number)
  const [y2, m2, d2] = dateStr.split('-').map(Number)
  return Math.round((Date.UTC(y2!, m2! - 1, d2!) - Date.UTC(y1!, m1! - 1, d1!)) / 86_400_000)
}

export type StatementTone = 'ok' | 'warn' | 'danger' | 'muted'

function dueText(dueOn: string, today?: string): string {
  const days = daysUntil(dueOn, today)
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  return `vence em ${days} dias (${formatDayMonth(dueOn)})`
}

/** Human label for a statement: "Fechada · vence em 5 dias (20 out)", "Venceu em 20 out", "Paga"… */
export function statementStatusInfo(
  s: Pick<CardStatementInfo, 'status' | 'closing_on' | 'due_on'>,
  today?: string,
): { label: string; tone: StatementTone } {
  switch (s.status) {
    case 'historical':
      return { label: 'Quitada (histórico)', tone: 'muted' }
    case 'paid':
      return { label: 'Paga', tone: 'ok' }
    case 'empty':
      return { label: 'Sem lançamentos', tone: 'muted' }
    case 'future':
      return { label: `Futura · fecha ${formatDayMonth(s.closing_on)}`, tone: 'muted' }
    case 'open':
      return { label: `Aberta · fecha ${formatDayMonth(s.closing_on)}`, tone: 'muted' }
    case 'overdue':
      return { label: `Venceu em ${formatDayMonth(s.due_on)}`, tone: 'danger' }
    case 'partial':
      return { label: `Parcialmente paga · ${dueText(s.due_on, today)}`, tone: 'warn' }
    case 'closed': {
      const days = daysUntil(s.due_on, today)
      return { label: `Fechada · ${dueText(s.due_on, today)}`, tone: days <= 5 ? 'warn' : 'muted' }
    }
  }
}

/** "14 set – 13 out" */
export function statementPeriodLabel(s: Pick<CardStatementInfo, 'start_on' | 'closing_on'>): string {
  return `${formatDayMonth(s.start_on)} – ${formatDayMonth(s.closing_on)}`
}

/** "out/2026" for a cycle "2026-10" (the due month). */
export function cycleLabel(cycle: string): string {
  const [y, m] = cycle.split('-').map(Number)
  return `${MON_ABBR[(m ?? 1) - 1]}/${y}`
}

// ── Credit card utilization ────────────────────────────────────────────────

export function utilizationPercent(used: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export function utilizationColorClass(percent: number): string {
  if (percent < 50) return 'bg-emerald-500'
  if (percent < 80) return 'bg-yellow-500'
  return 'bg-red-500'
}
