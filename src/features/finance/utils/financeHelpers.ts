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
