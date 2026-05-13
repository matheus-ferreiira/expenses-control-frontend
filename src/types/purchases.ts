export interface PurchaseItem {
  id: string
  user_id: string
  name: string
  category: string | null
  is_bought: boolean
  created_at: string
  updated_at: string
}

export interface CreatePurchaseItemPayload {
  name: string
  category?: string
}

export type UpdatePurchaseItemPayload = Partial<{
  name: string
  category: string | null
  is_bought: boolean
}>
