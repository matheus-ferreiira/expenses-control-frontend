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
    const item = await purchasesApi.create({ name, category })
    items.value.unshift(item)
    return item
  }

  async function toggleBought(id: string): Promise<void> {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    const item = items.value[idx]!
    const updated = await purchasesApi.update(id, { is_bought: !item.is_bought })
    items.value[idx] = updated
  }

  async function editItem(id: string, name: string, category?: string | null): Promise<void> {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    const updated = await purchasesApi.update(id, { name, category: category ?? null })
    items.value[idx] = updated
  }

  async function removeItem(id: string): Promise<void> {
    await purchasesApi.remove(id)
    items.value = items.value.filter((i) => i.id !== id)
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
