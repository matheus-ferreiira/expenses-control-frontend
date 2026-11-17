import { client, unwrap, unwrapPaginated } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type {
  BankConnection,
  BankConnectionsOverview,
  BankConnectionTransaction,
  BankReviewDecision,
  BankReviewItem,
  BankReviewResult,
} from '@/types/bankConnections'

const E = API_ENDPOINTS.BANK_CONNECTIONS

export const bankConnectionsApi = {
  status: () =>
    client
      .get<
        ApiResponse<{ configured: boolean; include_sandbox: boolean; to_review_count: number }>
      >(E.STATUS)
      .then(unwrap),
  overview: () => client.get<ApiResponse<BankConnectionsOverview>>(E.BASE).then(unwrap),
  /** Token de 30 min para o widget; com connectionId abre o widget para autorizar de novo */
  connectToken: (connectionId?: string) =>
    client
      .post<
        ApiResponse<{ access_token: string; update_item_id: string | null }>
      >(E.CONNECT_TOKEN, connectionId ? { connection_id: connectionId } : {})
      .then(unwrap),
  /** Registra o item que o widget criou; a primeira leitura pode levar alguns segundos */
  register: (itemId: string) =>
    client
      .post<ApiResponse<BankConnection>>(E.BASE, { item_id: itemId }, { timeout: 120000 })
      .then(unwrap),
  sync: (id: string) =>
    client
      .post<ApiResponse<BankConnection>>(E.SYNC(id), undefined, { timeout: 120000 })
      .then(unwrap),
  rename: (id: string, name: string | null) =>
    client.patch<ApiResponse<BankConnection>>(E.DETAIL(id), { name }).then(unwrap),
  disconnect: (id: string) => client.delete(E.DETAIL(id)),
  transactions: (accountId: string, page = 1) =>
    client
      .get<
        ApiResponse<BankConnectionTransaction[]>
      >(E.ACCOUNT_TRANSACTIONS(accountId), { params: { page, per_page: 50 } })
      .then(unwrapPaginated),
  /** Liga a conta do banco a uma conta (ou o cartão a um cartão) do app; null desliga */
  link: (
    accountId: string,
    payload: { bank_account_id?: string | null; credit_card_id?: string | null; import_from?: string | null },
  ) =>
    client
      .patch<ApiResponse<BankConnection>>(E.ACCOUNT(accountId), payload, { timeout: 120000 })
      .then(unwrap),
  /** "A lançar": transações do banco que ainda não estão no app, com sugestão */
  review: () =>
    client
      .get<ApiResponse<{ items: BankReviewItem[]; count: number }>>(E.REVIEW)
      .then(unwrap),
  applyReview: (items: BankReviewDecision[]) =>
    client
      .post<ApiResponse<BankReviewResult>>(E.REVIEW, { items }, { timeout: 120000 })
      .then(unwrap),
  /** Desfaz: ignorada volta para "A lançar"; lançada é apagada do app e volta para "A lançar" */
  undo: (bankTransactionId: string) =>
    client
      .post<ApiResponse<BankConnectionTransaction>>(E.REVIEW_UNDO(bankTransactionId))
      .then(unwrap),
}
