import type { AccountType, CreditCardNetwork } from '@/types/finance'

export interface CreateAccountPayload {
  name: string
  type: AccountType
  balance: number
  currency?: string
  color?: string
  icon?: string | null
  is_active?: boolean
}

export type UpdateAccountPayload = Partial<CreateAccountPayload>

export interface CreateCreditCardPayload {
  name: string
  network: CreditCardNetwork
  credit_limit: number
  current_balance?: number
  closing_day: number
  due_day: number
  color?: string
  is_active?: boolean
}

export type UpdateCreditCardPayload = Partial<CreateCreditCardPayload>

export const ACCOUNT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#64748b',
] as const

export const CARD_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#1e293b',
] as const

export const NETWORK_LABELS: Record<CreditCardNetwork, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  amex: 'Amex',
  other: 'Outro',
}
