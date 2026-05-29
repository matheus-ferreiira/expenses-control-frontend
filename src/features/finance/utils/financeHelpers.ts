import type { Component } from 'vue'
import { Landmark, PiggyBank, TrendingUp, Wallet } from 'lucide-vue-next'
import type { Transaction, TransactionType, AccountType } from '@/types/finance'
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
    } else {
      const d = new Date(`${date}T12:00:00`)
      const year = d.getFullYear()
      label = d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        ...(year !== currentYear ? { year: 'numeric' } : {}),
      })
    }

    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    return { date, label, transactions: txs, income, expenses }
  })

  // Compute running end-of-day balance (newest first → walk newest to oldest).
  // endBalance[newest] = totalBalance (right now)
  // endBalance[i+1]    = endBalance[i] − confirmed net delta of group[i]
  if (totalBalance !== undefined) {
    let running = totalBalance
    for (const group of groups) {
      group.endBalance = running
      const confirmedNet = group.transactions
        .filter((t) => t.status === 'confirmed')
        .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
      running -= confirmedNet
    }
  }

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
  /** YYYY-MM-DD — payment due date (dueDay of the following month) */
  dueDate: string
  /** True while the cycle is still accumulating charges (not yet closed) */
  isOpen: boolean
  /** True when cycle has closed but due date has not yet passed */
  isClosed: boolean
  /** Human-readable label, e.g. "16 abr – 15 mai" */
  label: string
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

  const MON_ABBR = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

  function label(dateStr: string): string {
    const [, m, d] = dateStr.split('-').map(Number)
    return `${d} ${MON_ABBR[(m ?? 1) - 1]}`
  }

  let startDate: string
  let endDate: string
  let dueDate: string
  let isClosed: boolean

  const todayClose = effectiveClose(todayYear, todayMonthIdx)

  if (todayDay > todayClose) {
    // We've passed this month's closing day → currently in the NEXT open cycle.
    // Cycle starts on (todayClose + 1) of this month, ends on closingDay of NEXT month.
    const startDay = todayClose + 1

    const nextMonthIdx = (todayMonthIdx + 1) % 12
    const nextYear = todayMonthIdx === 11 ? todayYear + 1 : todayYear
    const endDay = effectiveClose(nextYear, nextMonthIdx)

    const dueMonthIdx = (nextMonthIdx + 1) % 12
    const dueYear = nextMonthIdx === 11 ? nextYear + 1 : nextYear
    const dueDayEff = Math.min(dueDay, daysIn(dueYear, dueMonthIdx))

    startDate = iso(todayYear, todayMonthIdx, startDay)
    endDate   = iso(nextYear, nextMonthIdx, endDay)
    dueDate   = iso(dueYear, dueMonthIdx, dueDayEff)
    isClosed  = false // still open
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

    const dueMonthIdx = (todayMonthIdx + 1) % 12
    const dueYear = todayMonthIdx === 11 ? todayYear + 1 : todayYear
    const dueDayEff = Math.min(dueDay, daysIn(dueYear, dueMonthIdx))
    dueDate = iso(dueYear, dueMonthIdx, dueDayEff)

    // Closed = today is past the endDate (closing day already passed today)
    isClosed = todayDay === todayClose
      ? false // closing day itself → still open (end of day)
      : false // we're before closing day → open (handled by the outer else)
    // Note: if today > todayClose we'd be in the first branch; here today <= todayClose
    // so the cycle is always still open in this branch.
  }

  return {
    startDate,
    endDate,
    dueDate,
    isOpen: !isClosed,
    isClosed,
    label: `${label(startDate)} – ${label(endDate)}`,
  }
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
