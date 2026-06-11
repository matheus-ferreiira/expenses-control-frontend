import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type { TaskTag } from '@/types/tasks'

export interface CreateTaskTagPayload {
  name: string
  color?: string
}

export type UpdateTaskTagPayload = Partial<CreateTaskTagPayload>

export const taskTagsApi = {
  list: () =>
    client.get<ApiResponse<TaskTag[]>>(API_ENDPOINTS.TASK_TAGS.BASE).then(unwrap),

  create: (payload: CreateTaskTagPayload) =>
    client
      .post<ApiResponse<TaskTag>>(API_ENDPOINTS.TASK_TAGS.BASE, payload)
      .then(unwrap),

  update: (id: string, payload: UpdateTaskTagPayload) =>
    client
      .put<ApiResponse<TaskTag>>(API_ENDPOINTS.TASK_TAGS.DETAIL(id), payload)
      .then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.TASK_TAGS.DETAIL(id)).then(unwrap),
}
