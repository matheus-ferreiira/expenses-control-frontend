import { defineStore } from 'pinia'
import { shoppingApi } from '@/services/api/shopping'
import { useShoppingSessionStore } from '@/stores/shoppingSessions'
import type { ShoppingItem, CreateItemPayload, UpdateItemPayload } from '@/types/shopping'

export const useShoppingItemStore = defineStore('shoppingItems', () => {
  const sessionStore = useShoppingSessionStore()

  async function addItem(sessionId: string, payload: CreateItemPayload): Promise<ShoppingItem> {
    const item = await shoppingApi.items.create(sessionId, payload)
    sessionStore.updateSessionItems(sessionId, (s) => {
      s.items.push(item)
      s.items_count = s.items.length
    })
    return item
  }

  async function updateItem(itemId: string, payload: UpdateItemPayload): Promise<ShoppingItem> {
    const item = await shoppingApi.items.update(itemId, payload)
    const active = sessionStore.activeSession
    if (active) {
      sessionStore.updateSessionItems(active.id, (s) => {
        const idx = s.items.findIndex((i) => i.id === itemId)
        if (idx !== -1) s.items[idx] = item
        s.bought_count = s.items.filter((i) => i.is_bought).length
        s.suggested_total = s.items
          .filter((i) => i.is_bought && i.price !== null)
          .reduce((sum, i) => sum + (i.price ?? 0), 0)
      })
    }
    return item
  }

  async function toggleBought(itemId: string, currentValue: boolean): Promise<void> {
    await updateItem(itemId, { is_bought: !currentValue })
  }

  async function removeItem(itemId: string, sessionId: string): Promise<void> {
    await shoppingApi.items.delete(itemId)
    sessionStore.updateSessionItems(sessionId, (s) => {
      s.items = s.items.filter((i) => i.id !== itemId)
      s.items_count = s.items.length
      s.bought_count = s.items.filter((i) => i.is_bought).length
    })
  }

  return { addItem, updateItem, toggleBought, removeItem }
})
