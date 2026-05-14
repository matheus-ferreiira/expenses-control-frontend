import { client, unwrap, unwrapPaginated } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  BankAccount,
  CreditCard,
  Transaction,
  TransactionCategory,
  FinanceSummary,
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
        .post<ApiResponse<Transaction>>(API_ENDPOINTS.FINANCE.TRANSACTIONS, payload)
        .then(unwrap),

    update: (id: string, payload: UpdateTransactionPayload) =>
      client
        .put<ApiResponse<Transaction>>(API_ENDPOINTS.FINANCE.TRANSACTION_DETAIL(id), payload)
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

  reports: (params?: { month?: string; year?: number }) =>
    client
      .get<ApiResponse<FinanceSummary>>(API_ENDPOINTS.FINANCE.REPORTS, { params })
      .then(unwrap),
}
