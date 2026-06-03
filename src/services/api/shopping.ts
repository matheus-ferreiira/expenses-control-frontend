import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type {
  ShoppingSession,
  ShoppingItem,
  CreateSessionPayload,
  FinishSessionPayload,
  CreateItemPayload,
  UpdateItemPayload,
} from '@/types/shopping'

export const shoppingApi = {
  sessions: {
    list: () =>
      client
        .get<ApiResponse<ShoppingSession[]>>(API_ENDPOINTS.SHOPPING.SESSIONS)
        .then(unwrap),

    create: (payload: CreateSessionPayload) =>
      client
        .post<ApiResponse<ShoppingSession>>(API_ENDPOINTS.SHOPPING.SESSIONS, payload)
        .then(unwrap),

    get: (id: string) =>
      client
        .get<ApiResponse<ShoppingSession>>(API_ENDPOINTS.SHOPPING.SESSION_DETAIL(id))
        .then(unwrap),

    finish: (id: string, payload: FinishSessionPayload) =>
      client
        .post<ApiResponse<ShoppingSession>>(API_ENDPOINTS.SHOPPING.SESSION_FINISH(id), payload)
        .then(unwrap),

    delete: (id: string) => client.delete(API_ENDPOINTS.SHOPPING.SESSION_DETAIL(id)),
  },

  items: {
    create: (sessionId: string, payload: CreateItemPayload) =>
      client
        .post<ApiResponse<ShoppingItem>>(API_ENDPOINTS.SHOPPING.SESSION_ITEMS(sessionId), payload)
        .then(unwrap),

    update: (id: string, payload: UpdateItemPayload) =>
      client
        .put<ApiResponse<ShoppingItem>>(API_ENDPOINTS.SHOPPING.ITEM_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) => client.delete(API_ENDPOINTS.SHOPPING.ITEM_DETAIL(id)),
  },
}
