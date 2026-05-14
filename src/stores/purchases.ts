import { ref } from 'vue'
import { defineStore } from 'pinia'
import { purchasesApi } from '@/services/api/purchases'
import type { PurchaseItem } from '@/types/purchases'

export const usePurchaseStore = defineStore('purchases', () => {
  const items = ref<PurchaseItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      items.value = await purchasesApi.list()
    } catch {
      error.value = 'Erro ao carregar lista de compras'
    } finally {
      loading.value = false
    }
  }

  async function addItem(name: string, category?: string): Promise<PurchaseItem> {
    try {
      const item = await purchasesApi.create({ name, category })
      items.value.unshift(item)
      return item
    } catch (e: unknown) {
      error.value = 'Erro ao adicionar item'
      throw e
    }
  }

  async function toggleBought(id: string): Promise<void> {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    const item = items.value[idx]!
    try {
      const updated = await purchasesApi.update(id, { is_bought: !item.is_bought })
      items.value[idx] = updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar item'
      throw e
    }
  }

  async function editItem(id: string, name: string, category?: string | null): Promise<void> {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    try {
      const updated = await purchasesApi.update(id, { name, category: category ?? null })
      items.value[idx] = updated
    } catch (e: unknown) {
      error.value = 'Erro ao editar item'
      throw e
    }
  }

  async function removeItem(id: string): Promise<void> {
    try {
      await purchasesApi.remove(id)
      items.value = items.value.filter((i) => i.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao remover item'
      throw e
    }
  }

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    toggleBought,
    editItem,
    removeItem,
  }
})
