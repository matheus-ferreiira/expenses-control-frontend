import type { Task, TaskStatus, TaskPriority } from '@/types/tasks'
import { isOverdue, isToday, isTomorrow, formatRelative, formatDate } from '@/utils/date'

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high:   1,
  normal: 2,
  low:    3,
}

export type SortField = 'priority' | 'due_date' | 'created_at' | 'title' | 'order'
export type SortDirection = 'asc' | 'desc'

export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return tasks.reduce(
    (acc, task) => {
      acc[task.status].push(task)
      return acc
    },
    { pending: [], in_progress: [], completed: [], cancelled: [] } as Record<TaskStatus, Task[]>,
  )
}

export function sortTasks(tasks: Task[], field: SortField, direction: SortDirection): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0

    switch (field) {
      case 'priority':
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        break
      case 'due_date':
        if (!a.due_date && !b.due_date) cmp = 0
        else if (!a.due_date) cmp = 1
        else if (!b.due_date) cmp = -1
        else cmp = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        break
      case 'created_at':
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'title':
        cmp = a.title.localeCompare(b.title, 'pt-BR')
        break
      case 'order':
        cmp = a.order - b.order
        break
    }

    return direction === 'asc' ? cmp : -cmp
  })
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date) return false
  if (task.status === 'completed' || task.status === 'cancelled') return false
  return isOverdue(task.due_date)
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.due_date) return false
  return isToday(task.due_date)
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return ''
  if (isToday(dueDate)) return 'Hoje'
  if (isTomorrow(dueDate)) return 'Amanhã'
  return formatRelative(dueDate)
}

export function formatDueDateShort(dueDate: string | null): string {
  if (!dueDate) return ''
  if (isToday(dueDate)) return 'Hoje'
  if (isTomorrow(dueDate)) return 'Amanhã'
  return formatDate(dueDate, { day: '2-digit', month: 'short' })
}

export function getSubtaskProgress(task: Task): number {
  if (task.subtasks_count === 0) return 0
  return Math.round((task.completed_subtasks_count / task.subtasks_count) * 100)
}
