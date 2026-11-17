// Conexão bancária (Pluggy / MeuPluggy). Espelho do que o banco informa: não entra no livro-caixa.

/** Status do item na Pluggy; NOT_FOUND é local (a Pluggy não tem mais a conexão) */
export type BankConnectionStatus =
  | 'UPDATED'
  | 'UPDATING'
  | 'OUTDATED'
  | 'LOGIN_ERROR'
  | 'WAITING_USER_INPUT'
  | 'NOT_FOUND'

export interface BankConnectionAccount {
  id: string
  /** bank = conta corrente/poupança; credit = cartão (balance = fatura em aberto) */
  type: 'bank' | 'credit'
  subtype: 'CHECKING_ACCOUNT' | 'SAVINGS_ACCOUNT' | 'CREDIT_CARD' | string | null
  name: string
  number: string | null
  currency_code: string
  balance_cents: number
  credit_limit_cents: number | null
  available_credit_limit_cents: number | null
  balance_close_date: string | null
  balance_due_date: string | null
  transactions_count: number
  last_transaction_date: string | null
  transactions_synced_at: string | null
  /** Conta (bank) ou cartão (credit) do app com que esta conta é conferida */
  link: {
    bank_account_id: string | null
    credit_card_id: string | null
    name: string | null
    /** Primeiro dia oferecido em "A lançar" */
    import_from: string | null
  } | null
  to_review_count: number
}

/** null: conta não ligada · before_start: histórico · new: a lançar · matched: já estava no app · imported: lançada daqui · ignored */
export type BankReviewStatus = 'before_start' | 'new' | 'matched' | 'imported' | 'ignored' | null

export type BankReviewAction = 'expense' | 'income' | 'transfer' | 'pay_card' | 'confirm' | 'match' | 'ignore'

export interface BankReviewSuggestion {
  action: BankReviewAction
  description: string | null
  category_id: string | null
  is_reimbursement: boolean
  /** Transferência: a outra conta · Fatura: a conta que pagou */
  account_id: string | null
  /** Previsão a confirmar */
  transaction_id: string | null
  card_id: string | null
  /** Despesa dividida: a parte do usuário, sugerida pela divisão usada da última vez */
  own_share_cents: number | null
  /** forecast: previsão · rule: escolha anterior · history: lançamentos parecidos · pattern: padrão do extrato */
  source: 'forecast' | 'rule' | 'history' | 'pattern' | null
}

export interface BankReviewItem {
  id: string
  date: string
  description: string
  amount_cents: number
  direction: 'in' | 'out'
  status: 'posted' | 'pending'
  installment_number: number | null
  total_installments: number | null
  account: { id: string; type: 'bank' | 'credit'; name: string; bank_name: string; ledger_name: string | null }
  suggestion: BankReviewSuggestion
}

export interface BankReviewDecision {
  id: string
  action: BankReviewAction
  description?: string | null
  category_id?: string | null
  account_id?: string | null
  card_id?: string | null
  transaction_id?: string | null
  is_reimbursement?: boolean
  /** Despesa dividida com outras pessoas: só esta parte conta como gasto */
  own_share_cents?: number | null
  /** Lembrar a escolha para a mesma pessoa/empresa (padrão: sim) */
  remember?: boolean
}

export interface BankReviewResult {
  applied: number
  skipped: { id: string; message: string }[]
  remaining: number
}

export interface BankConnection {
  id: string
  provider: 'pluggy'
  /** Nome escolhido, senão o banco deduzido da conta, senão o conector */
  name: string
  custom_name: string | null
  connector: { id: number | null; name: string; image_url: string | null; color: string | null }
  status: BankConnectionStatus | string
  execution_status: string | null
  needs_action: boolean
  consent_expires_at: string | null
  provider_updated_at: string | null
  last_synced_at: string | null
  last_sync_error: string | null
  accounts: BankConnectionAccount[]
  created_at: string | null
}

export interface BankConnectionsOverview {
  connections: BankConnection[]
  totals: { bank_balance_cents: number; card_balance_cents: number; accounts_count: number; to_review_count: number }
}

export interface BankConnectionTransaction {
  id: string
  date: string
  description: string
  /** Sempre positivo; direction diz se entrou (in) ou saiu (out) */
  amount_cents: number
  direction: 'in' | 'out'
  status: 'posted' | 'pending'
  category: string | null
  installment_number: number | null
  total_installments: number | null
  review_status: BankReviewStatus
  /** Lançamento do app ligado a esta transação */
  transaction_id: string | null
}
