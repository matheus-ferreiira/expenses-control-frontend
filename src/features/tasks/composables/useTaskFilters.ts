import { ref, computed } from 'vue'
import type { TaskFilters, TaskStatus, TaskPriority } from '@/types/tasks'
import type { SortField, SortDirection } from '../utils/taskHelpers'

export interface ActiveFilters extends TaskFilters {
  sortField?: SortField
  sortDirection?: SortDirection
}

const DEFAULT_FILTERS: ActiveFilters = {
  sortField: 'order',
  sortDirection: 'asc',
}

export function useTaskFilters() {
  const filters = ref<ActiveFilters>({ ...DEFAULT_FILTERS })
  const search = ref('')

  const activeCount = computed(() => {
    let count = 0
    if (filters.value.status) count++
    if (filters.value.priority) count++
    if (filters.value.label_id) count++
    if (filters.value.due_date) count++
    if (search.value.trim()) count++
    return count
  })

  const hasActiveFilters = computed(() => activeCount.value > 0)

  const apiFilters = computed((): TaskFilters => {
    const f: TaskFilters = {}
    if (filters.value.status) f.status = filters.value.status
    if (filters.value.priority) f.priority = filters.value.priority
    if (filters.value.label_id) f.label_id = filters.value.label_id
    if (filters.value.due_date) f.due_date = filters.value.due_date
    if (search.value.trim()) f.search = search.value.trim()
    return f
  })

  function setStatus(status: TaskStatus | undefined) {
    filters.value.status = status
  }

  function setPriority(priority: TaskPriority | undefined) {
    filters.value.priority = priority
  }

  function setLabel(labelId: string | undefined) {
    filters.value.label_id = labelId
  }

  function setDueDate(date: string | undefined) {
    filters.value.due_date = date
  }

  function setSort(field: SortField, direction: SortDirection = 'asc') {
    filters.value.sortField = field
    filters.value.sortDirection = direction
  }

  function reset() {
    filters.value = { ...DEFAULT_FILTERS }
    search.value = ''
  }

  return {
    filters,
    search,
    activeCount,
    hasActiveFilters,
    apiFilters,
    setStatus,
    setPriority,
    setLabel,
    setDueDate,
    setSort,
    reset,
  }
}
