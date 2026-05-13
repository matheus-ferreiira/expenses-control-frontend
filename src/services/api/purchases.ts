import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type { PurchaseItem, CreatePurchaseItemPayload, UpdatePurchaseItemPayload } from '@/types/purchases'

export const purchasesApi = {
  list: () =>
    client.get<ApiResponse<PurchaseItem[]>>(API_ENDPOINTS.PURCHASES.BASE).then(unwrap),

  create: (payload: CreatePurchaseItemPayload) =>
    client.post<ApiResponse<PurchaseItem>>(API_ENDPOINTS.PURCHASES.BASE, payload).then(unwrap),

  update: (id: string, payload: UpdatePurchaseItemPayload) =>
    client.patch<ApiResponse<PurchaseItem>>(API_ENDPOINTS.PURCHASES.DETAIL(id), payload).then(unwrap),

  remove: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.PURCHASES.DETAIL(id)).then(unwrap),
}
