import { ref, computed } from 'vue'
import type { TransactionType, TransactionFilters } from '@/types/finance'
import { currentMonth, monthStart, monthEnd, addMonths } from '../utils/financeHelpers'

export function useTransactionFilters() {
  const search = ref('')
  const type = ref<TransactionType | undefined>(undefined)
  const category_id = ref<string | undefined>(undefined)
  const account_id = ref<string | undefined>(undefined)
  const month = ref<string>(currentMonth())

  const activeCount = computed(() => {
    let n = 0
    if (type.value) n++
    if (category_id.value) n++
    if (account_id.value) n++
    if (search.value.trim()) n++
    return n
  })

  const hasActiveFilters = computed(() => activeCount.value > 0)

  function toApiFilters(): TransactionFilters {
    return {
      type: type.value,
      category_id: category_id.value,
      account_id: account_id.value,
      start_date: monthStart(month.value),
      end_date: monthEnd(month.value),
      per_page: 100,
    }
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
    activeCount,
    hasActiveFilters,
    toApiFilters,
    prevMonth,
    nextMonth,
    isCurrentMonth,
    resetToCurrentMonth,
    setType,
    setCategoryId,
    setAccountId,
    reset,
  }
}
