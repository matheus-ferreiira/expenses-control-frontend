import { ref, computed } from 'vue'
import type { ViewMode } from '@/types/calendar'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addDays,
  formatMonthYear,
  formatWeekRange,
} from '../utils/calendarHelpers'

export function useCalendarNav() {
  const currentDate = ref(new Date())
  const viewMode = ref<ViewMode>('month')

  const currentYear = computed(() => currentDate.value.getFullYear())
  const currentMonth = computed(() => currentDate.value.getMonth())

  const currentWeekStart = computed(() => startOfWeek(currentDate.value))

  const monthLabel = computed(() => formatMonthYear(currentDate.value))

  const weekLabel = computed(() => {
    const start = startOfWeek(currentDate.value)
    const end = endOfWeek(currentDate.value)
    return formatWeekRange(start, end)
  })

  const headerLabel = computed(() => {
    if (viewMode.value === 'week') return weekLabel.value
    return monthLabel.value
  })

  const weekDays = computed<Date[]>(() => {
    const start = startOfWeek(currentDate.value)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  })

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
    // agenda: next 60 days
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 60)
    return { start, end }
  })

  function prev() {
    if (viewMode.value === 'week') {
      currentDate.value = addDays(currentDate.value, -7)
    } else {
      currentDate.value = addMonths(currentDate.value, -1)
    }
  }

  function next() {
    if (viewMode.value === 'week') {
      currentDate.value = addDays(currentDate.value, 7)
    } else {
      currentDate.value = addMonths(currentDate.value, 1)
    }
  }

  // Keep old names as aliases for backwards compat
  function prevMonth() { prev() }
  function nextMonth() { next() }

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
    currentWeekStart,
    monthLabel,
    weekLabel,
    headerLabel,
    weekDays,
    dateRange,
    prev,
    next,
    prevMonth,
    nextMonth,
    goToday,
    setView,
  }
}
