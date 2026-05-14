import { ref, computed } from 'vue'
import type { ViewMode } from '@/types/calendar'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  formatMonthYear,
} from '../utils/calendarHelpers'

export function useCalendarNav() {
  const currentDate = ref(new Date())
  const viewMode = ref<ViewMode>('month')

  const currentYear = computed(() => currentDate.value.getFullYear())
  const currentMonth = computed(() => currentDate.value.getMonth())

  const monthLabel = computed(() => formatMonthYear(currentDate.value))

  const dateRange = computed(() => {
    if (viewMode.value === 'month') {
      return {
        start: startOfMonth(currentYear.value, currentMonth.value),
        end: endOfMonth(currentYear.value, currentMonth.value),
      }
    }
    if (viewMode.value === 'week') {
      return {
        start: startOfWeek(currentDate.value),
        end: endOfWeek(currentDate.value),
      }
    }
    // agenda: next 30 days
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 30)
    return { start, end }
  })

  function prevMonth() {
    currentDate.value = addMonths(currentDate.value, -1)
  }

  function nextMonth() {
    currentDate.value = addMonths(currentDate.value, 1)
  }

  function goToday() {
    currentDate.value = new Date()
  }

  function setView(mode: ViewMode) {
    viewMode.value = mode
  }

  return {
    currentDate,
    viewMode,
    currentYear,
    currentMonth,
    monthLabel,
    dateRange,
    prevMonth,
    nextMonth,
    goToday,
    setView,
  }
}
