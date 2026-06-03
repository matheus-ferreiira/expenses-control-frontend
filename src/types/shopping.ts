export interface ShoppingSession {
  id: string
  user_id: string
  title: string
  status: 'active' | 'finished'
  total: number | null
  finished_at: string | null
  transaction_id: string | null
  items: ShoppingItem[]
  items_count: number
  bought_count: number
  suggested_total: number
  created_at: string
  updated_at: string
}

export interface ShoppingItem {
  id: string
  shopping_session_id: string
  name: string
  category: string | null
  is_bought: boolean
  price: number | null
  created_at: string
  updated_at: string
}

export interface CreateSessionPayload {
  title: string
}

export interface FinishSessionPayload {
  total: number
  bank_account_id?: string | null
  credit_card_id?: string | null
  category_id?: string | null
}

export interface CreateItemPayload {
  name: string
  category?: string | null
  price?: number | null
}

export type UpdateItemPayload = Partial<{
  name: string
  category: string | null
  is_bought: boolean
  price: number | null
}>
