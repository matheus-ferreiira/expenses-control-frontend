export type GoalType = 'financial' | 'habit' | 'productivity'
export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'paused'

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  financial: 'Financeira',
  habit: 'Hábito',
  productivity: 'Produtividade',
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  paused: 'Pausada',
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  type: GoalType
  status: GoalStatus
  target_value: number
  current_value: number
  unit: string | null
  target_date: string | null
  progress_percentage: number
  color: string
  icon: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateGoalPayload {
  title: string
  description?: string
  type: GoalType
  target_value: number
  current_value?: number
  unit?: string
  target_date?: string
  color?: string
  icon?: string
}

export type UpdateGoalPayload = Partial<CreateGoalPayload>

export interface UpdateGoalProgressPayload {
  current_value: number
}
