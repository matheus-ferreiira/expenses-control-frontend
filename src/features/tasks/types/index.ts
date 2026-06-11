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
  { status: 'pending',     label: 'Pendente',     colorClass: 'text-muted-foreground',  bgClass: 'bg-muted/20'    },
  { status: 'in_progress', label: 'Em progresso', colorClass: 'text-foreground/70',     bgClass: 'bg-muted/20'    },
  { status: 'completed',   label: 'Concluída',    colorClass: 'text-success',           bgClass: 'bg-success/10'  },
  { status: 'cancelled',   label: 'Cancelada',    colorClass: 'text-muted-foreground',  bgClass: 'bg-muted/20'    },
]

export const PRIORITY_STYLE: Record<import('@/types/tasks').TaskPriority, { text: string; bg: string; dot: string }> = {
  low:    { text: 'text-muted-foreground/70', bg: 'bg-muted/20',         dot: 'bg-muted-foreground/50' },
  normal: { text: 'text-foreground/70',       bg: 'bg-muted/20',         dot: 'bg-muted-foreground'    },
  high:   { text: 'text-orange-400',          bg: 'bg-orange-400/10',    dot: 'bg-orange-400'          },
  urgent: { text: 'text-destructive',         bg: 'bg-destructive/10',   dot: 'bg-destructive'         },
}

export const STATUS_STYLE: Record<import('@/types/tasks').TaskStatus, { text: string; bg: string }> = {
  pending:     { text: 'text-muted-foreground',  bg: 'bg-muted/20'       },
  in_progress: { text: 'text-foreground/70',     bg: 'bg-muted/20'       },
  completed:   { text: 'text-success',           bg: 'bg-success/10'     },
  cancelled:   { text: 'text-muted-foreground',  bg: 'bg-muted/20'       },
}
