import { ref, computed } from 'vue'
import type { TransactionType, TransactionStatus, TransactionFilters } from '@/types/finance'
import { currentMonth, monthStart, monthEnd, addMonths } from '../utils/financeHelpers'

/** Quick-filter tabs that map to API filter params. */
export type QuickFilter = 'all' | 'income' | 'expense' | 'fix' | 'pending'

export function useTransactionFilters() {
  const search = ref('')
  const type = ref<TransactionType | undefined>(undefined)
  const category_id = ref<string | undefined>(undefined)
  const account_id = ref<string | undefined>(undefined)
  const month = ref<string>(currentMonth())
  // Quick-filter pill selection: 'all' | 'income' | 'expense' | 'fix' | 'pending'
  const quickFilter = ref<QuickFilter>('all')

  /** Derived from quickFilter — these are what get sent to the API. */
  const is_recurring = computed<boolean | undefined>(() =>
    quickFilter.value === 'fix' ? true : undefined,
  )
  const status = computed<TransactionStatus | undefined>(() =>
    quickFilter.value === 'pending' ? 'pending' : undefined,
  )
  const quickType = computed<TransactionType | undefined>(() => {
    if (quickFilter.value === 'income') return 'income'
    if (quickFilter.value === 'expense') return 'expense'
    return undefined
  })

  const activeCount = computed(() => {
    let n = 0
    if (quickFilter.value !== 'all') n++
    if (category_id.value) n++
    if (account_id.value) n++
    if (search.value.trim()) n++
    return n
  })

  const hasActiveFilters = computed(() => activeCount.value > 0)

  function toApiFilters(): TransactionFilters {
    const filters: TransactionFilters = {
      category_id: category_id.value,
      account_id: account_id.value,
      start_date: monthStart(month.value),
      end_date: monthEnd(month.value),
      per_page: 100,
    }

    // Apply quick-filter derived values (override manual type if set via pill)
    if (quickType.value) filters.type = quickType.value
    else if (type.value) filters.type = type.value

    if (is_recurring.value !== undefined) filters.is_recurring = is_recurring.value
    if (status.value) filters.status = status.value

    return filters
  }

  function prevMonth() {
    month.value = addMonths(month.value, -1)
  }

  function nextMonth() {
    month.value = addMonths(month.value, 1)
  }

  function isCurrentMonth(): boolean {
    return month.value === currentMonth()
  }

  function resetToCurrentMonth() {
    month.value = currentMonth()
  }

  function setQuickFilter(f: QuickFilter) {
    quickFilter.value = f
    // Clear manual type filter when using quick pills
    type.value = undefined
  }

  function setType(t: TransactionType | undefined) {
    type.value = t
    category_id.value = undefined
  }

  function setCategoryId(id: string | undefined) {
    category_id.value = id
  }

  function setAccountId(id: string | undefined) {
    account_id.value = id
  }

  function reset() {
    quickFilter.value = 'all'
    type.value = undefined
    category_id.value = undefined
    account_id.value = undefined
    search.value = ''
  }

  return {
    search,
    type,
    category_id,
    account_id,
    month,
    quickFilter,
    is_recurring,
    status,
    activeCount,
    hasActiveFilters,
    toApiFilters,
    prevMonth,
    nextMonth,
    isCurrentMonth,
    resetToCurrentMonth,
    setQuickFilter,
    setType,
    setCategoryId,
    setAccountId,
    reset,
  }
}
