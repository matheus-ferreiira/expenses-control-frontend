export type AssistantEntity = 'task' | 'habit' | 'event'
export type AssistantOperation = 'create' | 'update' | 'delete'
export type AssistantFields = Record<string, string | number | boolean | number[] | null>

export interface AssistantAction {
  entity: AssistantEntity
  operation: AssistantOperation
  id: string | null
  data: AssistantFields
  before: AssistantFields | null
  timezone?: string
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  actions: AssistantAction[] | null
  status: 'pending' | 'applied' | 'rejected' | 'superseded' | null
  results: { entity: AssistantEntity; operation: AssistantOperation; id: string }[] | null
  expires_at: string | null
  created_at: string
}

export interface AssistantConversation {
  id: string
  title: string
  updated_at: string
  messages?: AssistantMessage[]
}
