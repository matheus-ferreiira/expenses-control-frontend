import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type { Goal, CreateGoalPayload, UpdateGoalPayload, UpdateGoalProgressPayload } from '@/types/goals'

export const goalsApi = {
  list: () =>
    client.get<ApiResponse<Goal[]>>(API_ENDPOINTS.GOALS.BASE, { params: { per_page: 500 } }).then(unwrap),

  get: (id: string) =>
    client.get<ApiResponse<Goal>>(API_ENDPOINTS.GOALS.DETAIL(id)).then(unwrap),

  create: (payload: CreateGoalPayload) =>
    client.post<ApiResponse<Goal>>(API_ENDPOINTS.GOALS.BASE, payload).then(unwrap),

  update: (id: string, payload: UpdateGoalPayload) =>
    client.put<ApiResponse<Goal>>(API_ENDPOINTS.GOALS.DETAIL(id), payload).then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.GOALS.DETAIL(id)).then(unwrap),

  updateProgress: (id: string, payload: UpdateGoalProgressPayload) =>
    client
      .patch<ApiResponse<Goal>>(API_ENDPOINTS.GOALS.PROGRESS(id), payload)
      .then(unwrap),
}
