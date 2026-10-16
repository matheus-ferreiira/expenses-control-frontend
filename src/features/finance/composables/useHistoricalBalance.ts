import { ref, watch, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { financeApi } from '@/services/api/finance'
import type { HistoricalBalance } from '@/types/finance'

export function useHistoricalBalance(month: Ref<string> | ComputedRef<string>) {
  const data = ref<HistoricalBalance | null>(null)
  const loading = ref(false)

  async function fetchBalance() {
    loading.value = true
    data.value = null
    try {
      const [year, m] = month.value.split('-').map(Number)
      data.value = await financeApi.getHistoricalBalance(year!, m!)
    } catch {
      data.value = null
    } finally {
      loading.value = false
    }
  }

  watch(month, fetchBalance, { immediate: true })

  return {
    loading,
    reload: fetchBalance,
    confirmedBalance: computed(() => data.value?.balance ?? null),
    projectedBalance: computed(() => data.value?.projected_balance ?? null),
    /** Faturas de cartão descontadas do saldo previsto */
    cardDue: computed(() => data.value?.card_due ?? 0),
    cardStatementsDue: computed(() => data.value?.card_statements ?? []),
    unverifiedAccountIds: computed(() => data.value?.unverified_accounts ?? []),
  }
}
