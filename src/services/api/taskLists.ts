import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type { TaskList } from '@/types/tasks'

export interface CreateTaskListPayload {
  name: string
  color?: string
  icon?: string
  position?: number
  is_default?: boolean
}

export type UpdateTaskListPayload = Partial<CreateTaskListPayload>

export const taskListsApi = {
  list: () =>
    client.get<ApiResponse<TaskList[]>>(API_ENDPOINTS.TASK_LISTS.BASE).then(unwrap),

  create: (payload: CreateTaskListPayload) =>
    client
      .post<ApiResponse<TaskList>>(API_ENDPOINTS.TASK_LISTS.BASE, payload)
      .then(unwrap),

  update: (id: string, payload: UpdateTaskListPayload) =>
    client
      .put<ApiResponse<TaskList>>(API_ENDPOINTS.TASK_LISTS.DETAIL(id), payload)
      .then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.TASK_LISTS.DETAIL(id)).then(unwrap),
}
