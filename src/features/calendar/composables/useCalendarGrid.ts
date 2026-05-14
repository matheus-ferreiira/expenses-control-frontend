import { computed } from 'vue'
import type { Ref } from 'vue'
import type { CalendarDay, CalendarEvent, CalendarWeek } from '@/types/calendar'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  isSameMonth,
  isToday,
  isWeekend,
  eventIntersectsDay,
} from '../utils/calendarHelpers'

export function useCalendarGrid(
  year: Ref<number>,
  month: Ref<number>,
  events: Ref<CalendarEvent[]>,
) {
  const weeks = computed<CalendarWeek[]>(() => {
    return buildMonthGrid(year.value, month.value, events.value)
  })

  return { weeks }
}

function buildMonthGrid(year: number, month: number, events: CalendarEvent[]): CalendarWeek[] {
  const monthStart = startOfMonth(year, month)
  const monthEnd = endOfMonth(year, month)

  // Grid starts on the Sunday before (or on) the first day of the month
  const gridStart = startOfWeek(monthStart, 0)

  const weeks: CalendarWeek[] = []
  const cursor = new Date(gridStart)

  while (cursor <= monthEnd || weeks.length % 1 === 0) {
    const week: CalendarDay[] = []

    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor)
      const dayEvents = events.filter((ev) =>
        eventIntersectsDay(ev.start_date, ev.end_date, date),
      )

      week.push({
        date,
        isCurrentMonth: isSameMonth(date, monthStart),
        isToday: isToday(date),
        isWeekend: isWeekend(date),
        events: dayEvents,
      })

      cursor.setDate(cursor.getDate() + 1)
    }

    weeks.push(week as CalendarWeek)

    // Stop after we've covered the full month (always 4, 5, or 6 weeks)
    if (cursor > monthEnd && weeks.length >= 4) break
  }

  return weeks
}
