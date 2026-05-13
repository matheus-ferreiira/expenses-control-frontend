export type TransactionType = 'income' | 'expense' | 'transfer'
export type AccountType = 'checking' | 'savings' | 'investment' | 'wallet'
export type CreditCardNetwork = 'visa' | 'mastercard' | 'elo' | 'amex' | 'other'

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  investment: 'Investimento',
  wallet: 'Carteira',
}

export interface TransactionCategory {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  icon: string | null
  created_at: string
}

export interface BankAccount {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  color: string
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreditCard {
  id: string
  user_id: string
  name: string
  network: CreditCardNetwork
  credit_limit: number
  current_balance: number
  closing_day: number
  due_day: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  account_id: string | null
  credit_card_id: string | null
  type: TransactionType
  amount: number
  description: string
  notes: string | null
  date: string
  is_recurring: boolean
  recurrence_pattern: string | null
  category?: TransactionCategory
  account?: BankAccount
  credit_card?: CreditCard
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FinanceSummary {
  total_income: number
  total_expenses: number
  balance: number
  period: string
}

export interface CreateTransactionPayload {
  category_id?: string
  account_id?: string
  credit_card_id?: string
  type: TransactionType
  amount: number
  description: string
  notes?: string
  date: string
  is_recurring?: boolean
  recurrence_pattern?: string
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>

export interface TransactionFilters {
  type?: TransactionType
  category_id?: string
  account_id?: string
  credit_card_id?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}
