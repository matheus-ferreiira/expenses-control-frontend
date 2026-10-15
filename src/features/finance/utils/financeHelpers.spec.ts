import { describe, it, expect } from 'vitest'
import { getCardBillingPeriod, formatDayMonth, groupTransactionsByDate, daysUntil, statementStatusInfo, cycleLabel } from './financeHelpers'
import type { Transaction } from '@/types/finance'

describe('recovered transactions', () => {
  it('uses personal economic amounts and never infers balances from a partial page', () => {
    const transactions = [
      { id: 'lunch', transaction_date: '2026-10-13', type: 'expense', amount: 83, status: 'confirmed', economic_effect: { income: 0, expense: 2075 } },
      { id: 'repayment', transaction_date: '2026-10-13', type: 'income', amount: 62.25, status: 'confirmed', economic_effect: { income: 0, expense: 0 } },
      { id: 'forecast', transaction_date: '2026-10-13', type: 'expense', amount: 100, status: 'pending' },
    ] as Transaction[]
    const groups = groupTransactionsByDate(transactions, 220.96)
    expect(groups[0]?.income).toBe(0)
    expect(groups[0]?.expenses).toBe(20.75)
    expect(groups[0]?.endBalance).toBeUndefined()
  })
})

describe('formatDayMonth', () => {
  it('formats an ISO date as "day month-abbr"', () => {
    expect(formatDayMonth('2026-07-13')).toBe('13 jul')
  })
})

describe('statementStatusInfo', () => {
  const october = { closing_on: '2026-10-13', due_on: '2026-10-20' }

  it('says a closed statement is still due, never "venceu", before the due date', () => {
    expect(statementStatusInfo({ ...october, status: 'closed' }, '2026-10-15')).toEqual({ label: 'Fechada · vence em 5 dias (20 out)', tone: 'warn' })
    expect(statementStatusInfo({ ...october, status: 'closed' }, '2026-10-20').label).toBe('Fechada · vence hoje')
  })

  it('labels overdue, paid, historical and open statements', () => {
    expect(statementStatusInfo({ ...october, status: 'overdue' }, '2026-10-21')).toEqual({ label: 'Venceu em 20 out', tone: 'danger' })
    expect(statementStatusInfo({ ...october, status: 'paid' }).label).toBe('Paga')
    expect(statementStatusInfo({ ...october, status: 'historical' }).label).toBe('Quitada (histórico)')
    expect(statementStatusInfo({ closing_on: '2026-11-13', due_on: '2026-11-20', status: 'open' }).label).toBe('Aberta · fecha 13 nov')
  })

  it('counts calendar days and formats cycles', () => {
    expect(daysUntil('2026-11-01', '2026-10-30')).toBe(2)
    expect(daysUntil('2026-10-20', '2026-10-21')).toBe(-1)
    expect(cycleLabel('2026-10')).toBe('out/2026')
  })
})

describe('getCardBillingPeriod', () => {
  it('keeps the due date in the same month as closing when dueDay > closingDay, after closing day has passed', () => {
    // hoje 30/06, closing_day=13, due_day=20 → fechamento 13/07, vencimento 20/07
    const period = getCardBillingPeriod(13, 20, new Date(2026, 5, 30))
    expect(period.endDate).toBe('2026-07-13')
    expect(period.dueDate).toBe('2026-07-20')
  })

  it('keeps the due date in the same month as closing when dueDay > closingDay, before closing day', () => {
    // hoje 10/06, closing_day=13, due_day=20 → fechamento 13/06 (ainda não passou), vencimento 20/06
    const period = getCardBillingPeriod(13, 20, new Date(2026, 5, 10))
    expect(period.endDate).toBe('2026-06-13')
    expect(period.dueDate).toBe('2026-06-20')
  })

  it('pushes the due date to the month after closing when dueDay <= closingDay', () => {
    // closing_day=28, due_day=5 → vencimento sempre no mês seguinte ao fechamento
    const period = getCardBillingPeriod(28, 5, new Date(2026, 5, 30))
    expect(period.endDate).toBe('2026-07-28')
    expect(period.dueDate).toBe('2026-08-05')
  })
})
