export interface SummaryCardData {
  label: string
  value: string | number
  subtext?: string
  loading?: boolean
}

export interface CashflowPoint {
  label: string
  income: number
  expense: number
  net: number
}

export type CashflowPeriod = '1S' | '1M' | '6M' | '1A'

export interface UpcomingBill {
  id: string
  name: string
  dueDate: string
  amount: number
  daysUntilDue: number
}
