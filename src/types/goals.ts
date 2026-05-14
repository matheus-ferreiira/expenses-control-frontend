export type GoalType =
  | 'financial'
  | 'health'
  | 'personal'
  | 'productivity'
  | 'habit'
  | 'learning'

export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'paused'

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  financial: 'Financeira',
  health: 'Saúde',
  personal: 'Pessoal',
  productivity: 'Produtividade',
  habit: 'Hábito',
  learning: 'Aprendizado',
}

export const GOAL_TYPE_GROUP_LABELS: Record<GoalType, string> = {
  financial: 'Financeiras',
  health: 'Saúde',
  personal: 'Pessoais',
  productivity: 'Produtividade',
  habit: 'Hábitos',
  learning: 'Aprendizado',
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  paused: 'Pausada',
}

export const GOAL_TYPE_ORDER: GoalType[] = [
  'financial',
  'health',
  'personal',
  'productivity',
  'habit',
  'learning',
]

export interface Goal {
  id: string
  user_id?: string
  title: string
  description: string | null
  type: GoalType
  status: GoalStatus
  target_amount: number | null
  current_amount: number
  progress_percentage: number
  target_date: string | null
  completed_at: string | null
  is_overdue: boolean
  created_at: string
  updated_at: string
}

export interface CreateGoalPayload {
  title: string
  description?: string
  type: GoalType
  target_amount?: number
  current_amount?: number
  target_date?: string
  status?: GoalStatus
}

export type UpdateGoalPayload = Partial<CreateGoalPayload>

export interface UpdateGoalProgressPayload {
  current_amount: number
}
