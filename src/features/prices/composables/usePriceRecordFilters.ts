import { ref, computed } from 'vue'
import type { PriceRecordFilters } from '@/features/prices/types'

const PER_PAGE = 25

/** Filter + pagination state for the price records log (PriceRecordsPage). */
export function usePriceRecordFilters() {
  const productId = ref<string | undefined>(undefined)
  const storeId = ref<string | undefined>(undefined)
  const dateFrom = ref<string | null>(null)
  const dateTo = ref<string | null>(null)
  const page = ref(1)

  const activeCount = computed(() => {
    let n = 0
    if (productId.value) n++
    if (storeId.value) n++
    if (dateFrom.value || dateTo.value) n++
    return n
  })

  const hasActiveFilters = computed(() => activeCount.value > 0)

  function toApiFilters(): PriceRecordFilters {
    const filters: PriceRecordFilters = {
      per_page: PER_PAGE,
      page: page.value,
    }
    if (productId.value) filters.product_id = productId.value
    if (storeId.value) filters.store_id = storeId.value
    if (dateFrom.value) filters.date_from = dateFrom.value
    if (dateTo.value) filters.date_to = dateTo.value
    return filters
  }

  function resetPage() {
    page.value = 1
  }

  function reset() {
    productId.value = undefined
    storeId.value = undefined
    dateFrom.value = null
    dateTo.value = null
    page.value = 1
  }

  return {
    productId,
    storeId,
    dateFrom,
    dateTo,
    page,
    activeCount,
    hasActiveFilters,
    toApiFilters,
    resetPage,
    reset,
  }
}
