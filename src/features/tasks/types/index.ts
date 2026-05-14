export type {
  Task,
  Subtask,
  TaskLabel,
  TaskStatus,
  TaskPriority,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from '@/types/tasks'

export {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '@/types/tasks'

export type ViewMode = 'list' | 'kanban' | 'calendar'
export type TaskViewId = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'no-date' | `label:${string}`

export interface KanbanColumn {
  status: import('@/types/tasks').TaskStatus
  label: string
  colorClass: string
  bgClass: string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { status: 'pending',     label: 'Pendente',      colorClass: 'text-slate-400',       bgClass: 'bg-slate-400/10' },
  { status: 'in_progress', label: 'Em progresso',  colorClass: 'text-blue-400',        bgClass: 'bg-blue-400/10'  },
  { status: 'completed',   label: 'Concluída',     colorClass: 'text-emerald-400',     bgClass: 'bg-emerald-400/10' },
  { status: 'cancelled',   label: 'Cancelada',     colorClass: 'text-muted-foreground', bgClass: 'bg-muted/30'    },
]

export const PRIORITY_STYLE: Record<import('@/types/tasks').TaskPriority, { text: string; bg: string; dot: string }> = {
  low:    { text: 'text-slate-400',  bg: 'bg-slate-400/10',  dot: 'bg-slate-400'  },
  normal: { text: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400'   },
  high:   { text: 'text-orange-400', bg: 'bg-orange-400/10', dot: 'bg-orange-400' },
  urgent: { text: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400'    },
}

export const STATUS_STYLE: Record<import('@/types/tasks').TaskStatus, { text: string; bg: string }> = {
  pending:     { text: 'text-slate-400',        bg: 'bg-slate-400/10'   },
  in_progress: { text: 'text-blue-400',         bg: 'bg-blue-400/10'    },
  completed:   { text: 'text-emerald-400',      bg: 'bg-emerald-400/10' },
  cancelled:   { text: 'text-muted-foreground', bg: 'bg-muted/30'       },
}
