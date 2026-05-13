import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type {
  Habit,
  HabitStats,
  HabitHeatmapEntry,
  CreateHabitPayload,
  UpdateHabitPayload,
  LogHabitPayload,
} from '@/types/habits'

export const habitsApi = {
  list: () =>
    client.get<ApiResponse<Habit[]>>(API_ENDPOINTS.HABITS.BASE).then(unwrap),

  get: (id: string) =>
    client.get<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.DETAIL(id)).then(unwrap),

  create: (payload: CreateHabitPayload) =>
    client.post<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.BASE, payload).then(unwrap),

  update: (id: string, payload: UpdateHabitPayload) =>
    client.put<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.DETAIL(id), payload).then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.HABITS.DETAIL(id)).then(unwrap),

  log: (id: string, payload?: LogHabitPayload) =>
    client.post<ApiResponse<Habit>>(API_ENDPOINTS.HABITS.LOG(id), payload).then(unwrap),

  unlog: (id: string, date?: string) =>
    client
      .delete<ApiResponse<null>>(API_ENDPOINTS.HABITS.UNLOG(id), { params: { date } })
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
