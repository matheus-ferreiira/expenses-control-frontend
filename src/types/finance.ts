export type TransactionType = 'income' | 'expense' | 'transfer'
export type AccountType = 'checking' | 'savings' | 'investment' | 'wallet'
export type TransactionStatus = 'confirmed' | 'pending'

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  confirmed: 'Confirmada',
  pending: 'Agendada',
}

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

export interface TransactionTag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface TransactionCategory {
  id: string
  user_id: string | null
  name: string
  type: TransactionType
  color: string
  icon: string | null
  is_default: boolean
  created_at: string
}

export interface BankAccount {
  id: string
  name: string
  bank_name: string | null
  type: AccountType
  balance: number
  currency: string
  color: string
  is_active: boolean
  created_at: string
}

export interface CreditCard {
  id: string
  bank_account_id: string | null
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  color: string
  is_active: boolean
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string | null
  card_id: string | null
  category_id: string | null
  type: TransactionType
  amount: number
  description: string
  notes: string | null
  transaction_date: string
  is_recurring: boolean
  recurrence_config: Record<string, unknown> | null
  status: TransactionStatus
  recurrence_group_id: string | null
  installment_number: number | null
  total_installments: number | null
  installment_group_id: string | null
  category?: TransactionCategory
  account?: BankAccount
  card?: CreditCard
  tags?: TransactionTag[]
  created_at: string
  updated_at: string
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
  card_id?: string
  type: TransactionType
  amount: number
  description: string
  notes?: string
  transaction_date: string
  is_recurring?: boolean
  recurrence_config?: Record<string, unknown>
  total_installments?: number
  tag_ids?: string[]
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>

export interface TransactionFilters {
  type?: TransactionType
  category_id?: string
  account_id?: string
  card_id?: string
  start_date?: string
  end_date?: string
  search?: string
  page?: number
  per_page?: number
}
