import { client, unwrap, unwrapPaginated } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  BankAccount,
  Budget,
  CreditCard,
  CreateBudgetDTO,
  CreateGoalDTO,
  FinanceGoal,
  FinanceSummary,
  Transaction,
  TransactionCategory,
  TransactionTag,
  UpdateBudgetDTO,
  UpdateGoalDTO,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  TransactionFilters,
} from '@/types/finance'

export const financeApi = {
  accounts: {
    list: () =>
      client.get<ApiResponse<BankAccount[]>>(API_ENDPOINTS.FINANCE.ACCOUNTS).then(unwrap),

    get: (id: string) =>
      client
        .get<ApiResponse<BankAccount>>(API_ENDPOINTS.FINANCE.ACCOUNT_DETAIL(id))
        .then(unwrap),

    create: (payload: Omit<BankAccount, 'id' | 'created_at'>) =>
      client
        .post<ApiResponse<BankAccount>>(API_ENDPOINTS.FINANCE.ACCOUNTS, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<Omit<BankAccount, 'id' | 'created_at'>>) =>
      client
        .patch<ApiResponse<BankAccount>>(API_ENDPOINTS.FINANCE.ACCOUNT_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.FINANCE.ACCOUNT_DETAIL(id))
        .then(unwrap),
  },

  cards: {
    list: () =>
      client.get<ApiResponse<CreditCard[]>>(API_ENDPOINTS.FINANCE.CARDS).then(unwrap),

    get: (id: string) =>
      client
        .get<ApiResponse<CreditCard>>(API_ENDPOINTS.FINANCE.CARD_DETAIL(id))
        .then(unwrap),

    create: (payload: Omit<CreditCard, 'id' | 'created_at'>) =>
      client
        .post<ApiResponse<CreditCard>>(API_ENDPOINTS.FINANCE.CARDS, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<Omit<CreditCard, 'id' | 'created_at'>>) =>
      client
        .patch<ApiResponse<CreditCard>>(API_ENDPOINTS.FINANCE.CARD_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.FINANCE.CARD_DETAIL(id))
        .then(unwrap),
  },

  transactions: {
    list: (filters?: TransactionFilters) =>
      client
        .get<PaginatedResponse<Transaction>>(API_ENDPOINTS.FINANCE.TRANSACTIONS, {
          params: filters,
        })
        .then(unwrapPaginated),

    get: (id: string) =>
      client
        .get<ApiResponse<Transaction>>(API_ENDPOINTS.FINANCE.TRANSACTION_DETAIL(id))
        .then(unwrap),

    create: (payload: CreateTransactionPayload) =>
      client
        .post<ApiResponse<Transaction | Transaction[]>>(API_ENDPOINTS.FINANCE.TRANSACTIONS, payload)
        .then(unwrap),

    update: (id: string, payload: UpdateTransactionPayload) =>
      client
        .put<ApiResponse<Transaction>>(API_ENDPOINTS.FINANCE.TRANSACTION_DETAIL(id), payload)
        .then(unwrap),

    confirm: (id: string) =>
      client
        .patch<ApiResponse<Transaction>>(
          `${API_ENDPOINTS.FINANCE.TRANSACTION_DETAIL(id)}/confirm`,
          {},
        )
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.FINANCE.TRANSACTION_DETAIL(id))
        .then(unwrap),
  },

  categories: {
    list: () =>
      client
        .get<ApiResponse<TransactionCategory[]>>(API_ENDPOINTS.FINANCE.CATEGORIES)
        .then(unwrap),

    create: (payload: Omit<TransactionCategory, 'id' | 'user_id' | 'created_at'>) =>
      client
        .post<ApiResponse<TransactionCategory>>(API_ENDPOINTS.FINANCE.CATEGORIES, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<TransactionCategory>) =>
      client
        .put<ApiResponse<TransactionCategory>>(
          API_ENDPOINTS.FINANCE.CATEGORY_DETAIL(id),
          payload,
        )
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.FINANCE.CATEGORY_DETAIL(id))
        .then(unwrap),
  },

  tags: {
    list: () =>
      client
        .get<ApiResponse<TransactionTag[]>>(API_ENDPOINTS.FINANCE.TAGS)
        .then(unwrap),

    create: (payload: Pick<TransactionTag, 'name' | 'color'>) =>
      client
        .post<ApiResponse<TransactionTag>>(API_ENDPOINTS.FINANCE.TAGS, payload)
        .then(unwrap),

    update: (id: string, payload: Partial<Pick<TransactionTag, 'name' | 'color'>>) =>
      client
        .put<ApiResponse<TransactionTag>>(API_ENDPOINTS.FINANCE.TAG_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.FINANCE.TAG_DETAIL(id))
        .then(unwrap),
  },

  budgets: {
    get: (month: number, year: number) =>
      client
        .get<ApiResponse<Budget | null>>(API_ENDPOINTS.FINANCE.BUDGETS, { params: { month, year } })
        .then(unwrap),

    getPrevious: (month: number, year: number) =>
      client
        .get<ApiResponse<Budget | null>>(API_ENDPOINTS.FINANCE.BUDGET_PREVIOUS, { params: { month, year } })
        .then(unwrap),

    create: (data: CreateBudgetDTO) =>
      client.post<ApiResponse<Budget>>(API_ENDPOINTS.FINANCE.BUDGETS, data).then(unwrap),

    update: (id: string, data: UpdateBudgetDTO) =>
      client.put<ApiResponse<Budget>>(API_ENDPOINTS.FINANCE.BUDGET_DETAIL(id), data).then(unwrap),

    delete: (id: string) =>
      client.delete<ApiResponse<null>>(API_ENDPOINTS.FINANCE.BUDGET_DETAIL(id)).then(unwrap),
  },

  goals: {
    list: () =>
      client.get<ApiResponse<FinanceGoal[]>>(API_ENDPOINTS.FINANCE.FINANCE_GOALS).then(unwrap),

    create: (data: CreateGoalDTO) =>
      client.post<ApiResponse<FinanceGoal & { create_recurring_transaction: boolean }>>(
        API_ENDPOINTS.FINANCE.FINANCE_GOALS,
        data,
      ).then(unwrap),

    update: (id: string, data: UpdateGoalDTO) =>
      client.put<ApiResponse<FinanceGoal>>(API_ENDPOINTS.FINANCE.FINANCE_GOAL_DETAIL(id), data).then(unwrap),

    complete: (id: string) =>
      client.post<ApiResponse<FinanceGoal>>(API_ENDPOINTS.FINANCE.FINANCE_GOAL_COMPLETE(id), {}).then(unwrap),

    delete: (id: string) =>
      client.delete<ApiResponse<null>>(API_ENDPOINTS.FINANCE.FINANCE_GOAL_DETAIL(id)).then(unwrap),
  },

  getHistoricalBalance: (year: number, month: number) =>
    client
      .get<ApiResponse<{ balance: number; projected_balance: number }>>(
        API_ENDPOINTS.FINANCE.BALANCE_HISTORICAL,
        { params: { year, month } },
      )
      .then(unwrap),

  reports: (params?: { month?: string; year?: number }) =>
    client
      .get<ApiResponse<FinanceSummary>>(API_ENDPOINTS.FINANCE.REPORTS, { params })
      .then(unwrap),

  monthlyReport: (year: number, month: number) =>
    client
      .get<ApiResponse<{
        year: number
        month: number
        income: number
        expenses: number
        balance: number
        pending_income: number
        pending_expenses: number
        transactions_count: number
        expenses_by_category: Array<{
          category: string
          color: string
          total: number
          count: number
          percentage: number
        }>
      }>>(API_ENDPOINTS.FINANCE.REPORTS_MONTHLY, { params: { year, month } })
      .then(unwrap),

  yearlyReport: (year: number) =>
    client
      .get<ApiResponse<{
        year: number
        months: Array<{
          month: number
          income: number
          expenses: number
          balance: number
        }>
      }>>(API_ENDPOINTS.FINANCE.REPORTS_YEARLY, { params: { year } })
      .then(unwrap),
}
