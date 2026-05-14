import { computed } from 'vue'
import type { Ref } from 'vue'
import type { CalendarEvent } from '@/types/calendar'
import { eventIntersectsDay } from '../utils/calendarHelpers'

export interface PositionedEvent {
  event: CalendarEvent
  topPct: number
  heightPct: number
  leftPct: number
  widthPct: number
}

const MINS_IN_DAY = 1440

function getMinutesFromMidnight(isoStr: string): number {
  const d = new Date(isoStr)
  return d.getHours() * 60 + d.getMinutes()
}

function getDurationMinutes(startIso: string, endIso: string, dayDate: Date): number {
  const start = new Date(startIso)
  const end = new Date(endIso)

  const dayStart = new Date(dayDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayDate)
  dayEnd.setHours(23, 59, 59, 999)

  const clampedStart = start < dayStart ? dayStart : start
  const clampedEnd = end > dayEnd ? dayEnd : end

  return Math.max(15, (clampedEnd.getTime() - clampedStart.getTime()) / 60000)
}

function getStartMinutes(isoStr: string, dayDate: Date): number {
  const start = new Date(isoStr)
  const dayStart = new Date(dayDate)
  dayStart.setHours(0, 0, 0, 0)

  if (start < dayStart) return 0
  return getMinutesFromMidnight(isoStr)
}

function assignColumns(events: PositionedEvent[]): void {
  if (events.length === 0) return

  const columns: PositionedEvent[][] = []

  for (const ev of events) {
    let placed = false
    for (const col of columns) {
      const last = col[col.length - 1]
      if (!last) continue
      const lastEndPct = last.topPct + last.heightPct
      if (lastEndPct <= ev.topPct) {
        col.push(ev)
        placed = true
        break
      }
    }
    if (!placed) columns.push([ev])
  }

  const totalCols = columns.length
  columns.forEach((col, colIdx) => {
    col.forEach((ev) => {
      ev.widthPct = 100 / totalCols
      ev.leftPct = colIdx * (100 / totalCols)
    })
  })
}

export function positionEventsForDay(
  events: CalendarEvent[],
  dayDate: Date,
): PositionedEvent[] {
  const timed = events.filter((e) => !e.is_all_day && eventIntersectsDay(e.start_date, e.end_date, dayDate))

  const positioned: PositionedEvent[] = timed
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .map((event) => {
      const startMins = getStartMinutes(event.start_date, dayDate)
      const durMins = getDurationMinutes(event.start_date, event.end_date, dayDate)
      return {
        event,
        topPct: (startMins / MINS_IN_DAY) * 100,
        heightPct: (durMins / MINS_IN_DAY) * 100,
        leftPct: 0,
        widthPct: 100,
      }
    })

  assignColumns(positioned)
  return positioned
}

export function useWeekPositioning(
  weekDays: Ref<Date[]>,
  events: Ref<CalendarEvent[]>,
) {
  const positionedByDay = computed(() =>
    weekDays.value.map((day) => ({
      day,
      positioned: positionEventsForDay(events.value, day),
      allDay: events.value.filter(
        (e) => e.is_all_day && eventIntersectsDay(e.start_date, e.end_date, day),
      ),
    })),
  )

  return { positionedByDay }
}
