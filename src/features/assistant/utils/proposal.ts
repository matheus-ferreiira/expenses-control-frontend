import type { AssistantAction, AssistantFields } from '@/types/assistant'

export const entityLabels = { task: 'Tarefa', habit: 'Hábito', event: 'Evento' }
export const operationLabels = { create: 'Criar', update: 'Editar', delete: 'Excluir' }
const fields: Record<string, string> = {
  title: 'Título',
  name: 'Nome',
  description: 'Descrição',
  priority: 'Prioridade',
  due_date: 'Data',
  due_time: 'Horário',
  estimated_minutes: 'Duração',
  recurrence_type: 'Repetição',
  frequency_type: 'Frequência',
  target_frequency: 'Meta por período',
  target_days: 'Dias da semana',
  start_date: 'Início',
  end_date: 'Fim',
  location: 'Local',
  is_all_day: 'Dia inteiro',
}
const values: Record<string, string> = {
  none: 'Não repete',
  daily: 'Diária',
  weekdays: 'Dias úteis',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
  custom: 'Dias escolhidos',
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}
const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function formatProposalValue(key: string, value: AssistantFields[string]): string {
  if (value === null || value === '') return 'Não definido'
  if (Array.isArray(value)) return value.map((day) => days[day]).join(', ') || 'Não definido'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (key === 'estimated_minutes') return `${value} min`
  if (['priority', 'recurrence_type', 'frequency_type'].includes(key))
    return values[String(value)] ?? String(value)
  if (['due_date', 'start_date', 'end_date'].includes(key) && typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/.exec(value)
    if (match) return `${match[3]}/${match[2]}/${match[1]}${match[4] ? ` às ${match[4]}` : ''}`
  }
  return String(value)
}

export function proposalRows(action: AssistantAction) {
  const data = action.operation === 'delete' ? (action.before ?? {}) : action.data
  return Object.entries(data)
    .filter(([key, value]) => fields[key] && (value !== null || action.operation === 'update'))
    .map(([key, value]) => ({
      key,
      label: fields[key],
      value: formatProposalValue(key, value),
      before:
        action.operation === 'update' && action.before
          ? formatProposalValue(key, action.before[key] ?? null)
          : null,
    }))
}
