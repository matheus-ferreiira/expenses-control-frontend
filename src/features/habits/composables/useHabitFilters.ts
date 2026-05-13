import { ref, computed } from 'vue'
import type { HabitFrequency } from '@/types/habits'

export function useHabitFilters() {
  const search = ref('')
  const frequency = ref<HabitFrequency | undefined>(undefined)
  const showArchived = ref(false)

  const activeCount = computed(() => {
    let count = 0
    if (frequency.value) count++
    if (showArchived.value) count++
    if (search.value.trim()) count++
    return count
  })

  const hasActiveFilters = computed(() => activeCount.value > 0)

  function setFrequency(f: HabitFrequency | undefined) {
    frequency.value = f
  }

  function toggleArchived() {
    showArchived.value = !showArchived.value
  }

  function reset() {
    frequency.value = undefined
    showArchived.value = false
    search.value = ''
  }

  return {
    search,
    frequency,
    showArchived,
    activeCount,
    hasActiveFilters,
    setFrequency,
    toggleArchived,
    reset,
  }
}
