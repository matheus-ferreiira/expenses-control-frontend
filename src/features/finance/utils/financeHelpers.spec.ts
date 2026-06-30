import { describe, it, expect } from 'vitest'
import { getCardBillingPeriod, formatDayMonth } from './financeHelpers'

describe('formatDayMonth', () => {
  it('formats an ISO date as "day month-abbr"', () => {
    expect(formatDayMonth('2026-07-13')).toBe('13 jul')
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
