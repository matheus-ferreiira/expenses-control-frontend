import { client, unwrap } from './client'
import type { ApiResponse } from '@/types/api'
import type { AssistantConversation, AssistantMessage } from '@/types/assistant'

const base = '/api/v1/assistant'
export const assistantApi = {
  status: () => client.get<ApiResponse<{ configured: boolean }>>(`${base}/status`).then(unwrap),
  list: (page = 1) =>
    client
      .get<
        ApiResponse<{ items: AssistantConversation[]; has_more: boolean }>
      >(`${base}/conversations`, { params: { page } })
      .then(unwrap),
  create: () =>
    client.post<ApiResponse<AssistantConversation>>(`${base}/conversations`).then(unwrap),
  get: (id: string) =>
    client.get<ApiResponse<AssistantConversation>>(`${base}/conversations/${id}`).then(unwrap),
  send: (id: string, payload: { message: string; date: string; request_id: string }) =>
    client
      .post<
        ApiResponse<AssistantMessage>
      >(`${base}/conversations/${id}/messages`, payload, { timeout: 120000 })
      .then(unwrap),
  approve: (id: string, messageId: string) =>
    client
      .post<
        ApiResponse<AssistantMessage>
      >(`${base}/conversations/${id}/messages/${messageId}/approve`, { confirmed: true })
      .then(unwrap),
  reject: (id: string, messageId: string) =>
    client
      .post<
        ApiResponse<AssistantMessage>
      >(`${base}/conversations/${id}/messages/${messageId}/reject`)
      .then(unwrap),
}
