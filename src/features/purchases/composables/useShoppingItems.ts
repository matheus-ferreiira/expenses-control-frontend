import { computed } from 'vue'
import type { ShoppingItem } from '@/types/shopping'

export function useShoppingItems(items: () => ShoppingItem[]) {
  const grouped = computed(() => {
    const groups: Record<string, { pending: ShoppingItem[]; bought: ShoppingItem[] }> = {}

    for (const item of items()) {
      const key = item.category || 'Sem categoria'
      if (!groups[key]) groups[key] = { pending: [], bought: [] }
      if (item.is_bought) {
        groups[key]!.bought.push(item)
      } else {
        groups[key]!.pending.push(item)
      }
    }

    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Sem categoria') return 1
      if (b === 'Sem categoria') return -1
      return a.localeCompare(b, 'pt-BR')
    })
  })

  const pendingCount = computed(() => items().filter((i) => !i.is_bought).length)
  const boughtCount = computed(() => items().filter((i) => i.is_bought).length)

  return { grouped, pendingCount, boughtCount }
}
