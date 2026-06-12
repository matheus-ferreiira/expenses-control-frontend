export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekday' | 'custom'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em progresso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}

export interface TaskLabel {
  id: string
  name: string
  color: string
}

export interface TaskList {
  id: string
  name: string
  color: string | null
  icon: string | null
  position: number
  is_default: boolean
  tasks_count?: number
}

export interface TaskTag {
  id: string
  name: string
  color: string | null
}

export interface Subtask {
  id: string
  title: string
  is_completed: boolean
  completed_at: string | null
  position: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  parent_task_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  due_time: string | null
  completed_at: string | null
  order: number
  is_archived: boolean
  task_list_id: string | null
  task_list?: TaskList | null
  estimated_minutes: number | null
  recurrence_type: RecurrenceType
  recurrence_config: Record<string, unknown> | null
  next_occurrence_date: string | null
  labels: TaskLabel[]
  tags: TaskTag[]
  subtasks: Subtask[]
  subtasks_count: number
  completed_subtasks_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface RecurrenceHistoryEntry {
  id: string
  completed_at: string | null
  due_date: string | null
}

export interface RecurrenceHistory {
  total_count: number
  completed_count: number
  completion_rate: number
  current_streak: number
  recent_completions: RecurrenceHistoryEntry[]
}

export interface CreateTaskPayload {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
  due_time?: string
  label_ids?: string[]
  tag_ids?: string[]
  task_list_id?: string | null
  estimated_minutes?: number | null
  recurrence_type?: RecurrenceType
  recurrence_config?: Record<string, unknown>
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export interface UpdateSubtaskPayload {
  title?: string
  is_completed?: boolean
  position?: number
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority
  label_id?: string
  due_date?: string
  search?: string
  is_archived?: boolean
  page?: number
  per_page?: number
}
