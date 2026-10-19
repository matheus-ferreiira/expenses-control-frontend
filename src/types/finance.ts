export type TransactionType = 'income' | 'expense' | 'transfer'
export type AccountType = 'checking' | 'savings' | 'investment' | 'wallet' | 'cash'
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
  investment: 'Caixinha / investimento',
  wallet: 'Carteira',
  cash: 'Dinheiro',
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
  monthly_limit: number | null
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
  /** Última conferência de saldo (YYYY-MM-DD) */
  last_checked_on?: string | null
  /** A conta tem um ponto de partida conferido (entra no saldo reconstruído) */
  balance_verified?: boolean
  /** Dinheiro guardado (caixinha, investimento): fora do saldo disponível e do previsto */
  is_reserve?: boolean
  created_at: string
}

/** Uma conferência de saldo: o valor visto no banco comparado ao que o app calcula para a data */
export interface BalanceObservation {
  id: string
  kind: 'opening' | 'observation'
  observed_on: string
  observed_cents: number
  calculated_cents: number | null
  difference_cents: number | null
  recorded_at: string
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

/** Situação de uma fatura, calculada no backend (CardCycle::status). */
export type CardStatementStatus =
  | 'future' | 'open' | 'closed' | 'partial' | 'overdue' | 'paid' | 'empty' | 'historical'

/** Uma fatura identificada pelo mês de vencimento ("YYYY-MM"). Valores em centavos. */
export interface CardStatementInfo {
  cycle: string
  start_on: string
  closing_on: string
  due_on: string
  status: CardStatementStatus
  charges_cents: number
  paid_cents: number
  remaining_cents: number
}

export interface CardStatementDetail extends CardStatementInfo {
  historical: boolean
  transactions: Transaction[]
  payments: Transaction[]
  documentary_cents: number | null
  manual_cents: number | null
  difference_cents: number | null
}

/** Resumo do cartão: faturas a pagar, fatura aberta, próximas faturas e limite real. */
export interface CardOverview {
  card_id: string
  today: string
  open_cycle: string
  to_pay: CardStatementInfo[]
  open: CardStatementInfo
  upcoming: CardStatementInfo[]
  upcoming_total_cents: number
  limit_cents: number
  used_cents: number
  available_cents: number
}

export interface Transaction {
  economic_kind?: string | null
  classification_status?: string | null
  reconciliation_status?: string | null
  economic_effect?: { income: number; expense: number }
  recovery_locked?: boolean
  original_purchase_on?: string | null
  statement_due_on?: string | null
  id: string
  account_id: string | null
  /** For type=transfer: the account being credited (destination) */
  destination_account_id: string | null
  card_id: string | null
  /** "YYYY-MM" — fatura quitada por esta transação (só em pagamentos de fatura) */
  statement_month: string | null
  category_id: string | null
  goal_id: string | null
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
  /** Destination account for transfers */
  destination_account?: BankAccount
  card?: CreditCard
  tags?: TransactionTag[]
  /** Finance goal this transaction contributes to (aporte) */
  goal?: Pick<FinanceGoal, 'id' | 'name' | 'color' | 'icon'>
  created_at: string
  updated_at: string
}

// ── Budget ─────────────────────────────────────────────────────────────────

export type BudgetItemStatus = 'on_track' | 'warning' | 'exceeded'

export interface BudgetItem {
  id: string
  category_id: string
  category_name: string | null
  category_color: string | null
  category_icon: string | null
  amount: number
  percentage: number
  spent: number
  spent_percentage: number
  remaining: number
  status: BudgetItemStatus
}

export interface BudgetSummary {
  base_amount: number
  total_from_categories: number
  total_from_goals: number
  total_budgeted: number
  total_budgeted_percentage: number
  total_spent: number
  /** Gasto do mês em categorias sem item no orçamento */
  unbudgeted_spent?: number
  /** Gasto do mês sem categoria (o orçamento não consegue acompanhar) */
  uncategorized_spent?: number
  free_amount: number
  free_percentage: number
  categories_percentage: number
  goals_percentage: number
}

export interface BudgetGoalItem {
  id: string
  name: string
  color: string | null
  icon: string | null
  amount: number
  percentage: number
  type: 'goal'
}

export interface Budget {
  id: string
  month: number
  year: number
  base_amount: number
  is_template: boolean
  summary: BudgetSummary
  items: BudgetItem[]
  goals_items: BudgetGoalItem[]
  created_at: string
  updated_at: string
}

export interface CreateBudgetDTO {
  month: number
  year: number
  base_amount: number
  is_template?: boolean
  items?: Array<{ category_id: string; amount: number; percentage?: number }>
}

export interface UpdateBudgetDTO {
  base_amount?: number
  is_template?: boolean
  items?: Array<{ category_id: string; amount: number; percentage?: number }>
}

// ── Finance Goals ──────────────────────────────────────────────────────────

export type FinanceGoalStatus = 'active' | 'completed' | 'paused'

export interface FinanceGoal {
  id: string
  name: string
  target_amount: number
  monthly_contribution: number
  deadline: string | null
  color: string | null
  icon: string | null
  bank_account_id: string | null
  bank_account: { id: string; name: string } | null
  status: FinanceGoalStatus
  current_amount: number
  progress_percentage: number
  remaining: number
  months_remaining: number | null
  on_track: boolean | null
  created_at: string
  updated_at: string
}

export interface CreateGoalDTO {
  name: string
  target_amount: number
  monthly_contribution?: number
  deadline?: string | null
  color?: string | null
  icon?: string | null
  bank_account_id?: string | null
}

export interface UpdateGoalDTO extends Partial<CreateGoalDTO> {
  status?: FinanceGoalStatus
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
  /** Required when type=transfer — must differ from account_id */
  destination_account_id?: string
  card_id?: string
  goal_id?: string | null
  type: TransactionType
  amount: number
  description: string
  notes?: string
  transaction_date: string
  is_recurring?: boolean
  /** Receita que devolve dinheiro já gasto: não conta como renda */
  is_reimbursement?: boolean
  recurrence_config?: Record<string, unknown>
  total_installments?: number
  tag_ids?: string[]
}

export type RecurrenceUpdateScope = 'this_only' | 'this_and_future' | 'all'

export type UpdateTransactionPayload = Partial<CreateTransactionPayload> & {
  scope?: RecurrenceUpdateScope
}

export interface CategoryBreakdownItem {
  category_id: string | null
  category: string
  color: string
  total: number
  count: number
  percentage: number
}

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
  is_recurring?: boolean
  status?: TransactionStatus
  sort_by?: 'transaction_date' | 'amount' | 'description' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

/** Fatura de cartão descontada do saldo previsto (valor ainda a pagar). */
export interface CardStatementDue {
  card_id: string
  card_name: string
  cycle: string
  due_on: string
  remaining_cents: number
}

export interface HistoricalBalance {
  balance: number
  /** Saldo + previstos − faturas de cartão que vencem até o fim do mês */
  projected_balance: number
  card_due?: number
  card_statements?: CardStatementDue[]
  /** Contas somadas pelo saldo registrado, sem saldo inicial conferido (ex.: carteira) */
  unverified_accounts?: string[]
  /** Total nas contas de reserva (caixinhas) ao fim do mês */
  reserve_balance?: number
  /** Reserva + transferências previstas para as caixinhas até o fim do mês */
  projected_reserve_balance?: number
}
