import type { AccountType } from '@/types/finance'

export interface CreateAccountPayload {
  name: string
  type: AccountType
  balance: number
  bank_name?: string
  currency?: string
  color?: string
  is_active?: boolean
}

export type UpdateAccountPayload = Partial<CreateAccountPayload>

export interface CreateCreditCardPayload {
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  color?: string
  is_active?: boolean
  bank_account_id?: string | null
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

