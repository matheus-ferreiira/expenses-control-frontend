import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  Task,
  Subtask,
  TaskLabel,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from '@/types/tasks'

export const tasksApi = {
  list: (filters?: TaskFilters) =>
    client
      .get<PaginatedResponse<Task>>(API_ENDPOINTS.TASKS.BASE, { params: filters })
      .then(unwrap),

  get: (id: string) =>
    client.get<ApiResponse<Task>>(API_ENDPOINTS.TASKS.DETAIL(id)).then(unwrap),

  create: (payload: CreateTaskPayload) =>
    client.post<ApiResponse<Task>>(API_ENDPOINTS.TASKS.BASE, payload).then(unwrap),

  update: (id: string, payload: UpdateTaskPayload) =>
    client.put<ApiResponse<Task>>(API_ENDPOINTS.TASKS.DETAIL(id), payload).then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.TASKS.DETAIL(id)).then(unwrap),

  archive: (id: string) =>
    client.post<ApiResponse<Task>>(API_ENDPOINTS.TASKS.ARCHIVE(id)).then(unwrap),

  reorder: (ids: string[]) =>
    client.post<ApiResponse<null>>(API_ENDPOINTS.TASKS.REORDER, { ids }).then(unwrap),

  subtasks: {
    list: (taskId: string) =>
      client
        .get<ApiResponse<Subtask[]>>(API_ENDPOINTS.TASKS.SUBTASKS(taskId))
        .then(unwrap),

    create: (taskId: string, title: string) =>
      client
        .post<ApiResponse<Subtask>>(API_ENDPOINTS.TASKS.SUBTASKS(taskId), { title })
        .then(unwrap),

    update: (taskId: string, id: string, payload: Partial<Subtask>) =>
      client
        .put<ApiResponse<Subtask>>(API_ENDPOINTS.TASKS.SUBTASK_DETAIL(taskId, id), payload)
        .then(unwrap),

    delete: (taskId: string, id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.TASKS.SUBTASK_DETAIL(taskId, id))
        .then(unwrap),
  },

  labels: {
    list: () =>
      client.get<ApiResponse<TaskLabel[]>>(API_ENDPOINTS.TASKS.LABELS).then(unwrap),

    create: (payload: Omit<TaskLabel, 'id'>) =>
      client.post<ApiResponse<TaskLabel>>(API_ENDPOINTS.TASKS.LABELS, payload).then(unwrap),

    delete: (id: string) =>
      client
        .delete<ApiResponse<null>>(API_ENDPOINTS.TASKS.LABEL_DETAIL(id))
        .then(unwrap),
  },
}
