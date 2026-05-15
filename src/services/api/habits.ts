import { client, unwrap, unwrapPaginated } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  Habit,
  HabitStats,
  HabitHeatmapEntry,
  CreateHabitPayload,
  UpdateHabitPayload,
  LogHabitPayload,
} from '@/types/habits'
import { toISODate } from '@/utils/date'

export const habitsApi = {
  list: (params?: { per_page?: number }) =>
    client
      .get<PaginatedResponse<Habit>>(API_ENDPOINTS.HABITS.BASE, { params })
      .then(unwrapPaginated),

  get: (id: string) =>
    client.get<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.DETAIL(id)).then(unwrap),

  create: (payload: CreateHabitPayload) =>
    client.post<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.BASE, payload).then(unwrap),

  update: (id: string, payload: UpdateHabitPayload) =>
    client.put<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.DETAIL(id), payload).then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.HABITS.DETAIL(id)).then(unwrap),

  archive: (id: string) =>
    client.patch<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.ARCHIVE(id)).then(unwrap),

  unarchive: (id: string) =>
    client.patch<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.UNARCHIVE(id)).then(unwrap),

  log: (id: string, payload?: LogHabitPayload) =>
    client
      .post<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.LOG(id), {
        completed_date: payload?.date ?? toISODate(new Date()),
        notes: payload?.notes,
      })
      .then(unwrap),

  unlog: (id: string, date?: string) =>
    client
      .delete<ApiResponse<null>>(API_ENDPOINTS.HABITS.UNLOG(id), {
        params: { date: date ?? toISODate(new Date()) },
      })
      .then(unwrap),

  stats: (id: string) =>
    client.get<ApiResponse<HabitStats>>(API_ENDPOINTS.HABITS.STATS(id)).then(unwrap),

  heatmap: (id: string) =>
    client
      .get<ApiResponse<HabitHeatmapEntry[]>>(API_ENDPOINTS.HABITS.HEATMAP(id))
      .then(unwrap),

  today: () =>
    client.get<ApiResponse<Habit[]>>(API_ENDPOINTS.HABITS.TODAY).then(unwrap),
}
