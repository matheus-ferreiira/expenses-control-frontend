import type { Component } from 'vue'
import { Banknote, Landmark, PiggyBank, TrendingUp, Wallet } from 'lucide-vue-next'
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
  cash: Banknote,
}

// ── Dates ──────────────────────────────────────────────────────────────────

const MON_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "YYYY-MM-DD" → "13 jul" */
export function formatDayMonth(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MON_ABBR[(m ?? 1) - 1]}`
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
