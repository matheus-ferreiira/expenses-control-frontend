import type { Habit, HabitHeatmapEntry } from '@/types/habits'
import { toISODate, formatDate } from '@/utils/date'
import { WEEKDAY_LABELS, type DotDay, type HeatmapCell } from '../types'

export function isCompletedToday(habit: Habit): boolean {
  const today = toISODate(new Date())
  return habit.logs.some((l) => l.completed_date === today)
}

export function streakLabel(n: number): string {
  if (n === 0) return '—'
  if (n === 1) return '1 dia'
  return `${n} dias`
}

export function getWeeklyDots(habit: Habit): DotDay[] {
  const today = new Date()
  const todayStr = toISODate(today)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - 6 + i)
    const dateStr = toISODate(date)
    const dayOfWeek = date.getDay()

    const isTarget =
      habit.frequency === 'daily' ||
      (habit.frequency === 'weekly' && habit.target_days.includes(dayOfWeek)) ||
      (habit.frequency === 'monthly' && habit.target_days.includes(dayOfWeek))

    const isLogged = habit.logs.some((l) => l.completed_date === dateStr)
    const isFuture = dateStr > todayStr

    return {
      date: dateStr,
      dayOfWeek,
      dayLabel: WEEKDAY_LABELS[dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6],
      isTarget,
      isLogged,
      isToday: dateStr === todayStr,
      isFuture,
    } satisfies DotDay
  })
}

export function buildHeatmapGrid(
  entries: HabitHeatmapEntry[],
  weeks = 12,
): HeatmapCell[][] {
  const entryMap = new Map<string, number>(entries.map((e) => [e.date, e.count]))

  const today = new Date()
  // Start from `weeks` full weeks ago, aligned to Sunday
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeks * 7 - 1))

  // Grid: weeks columns × 7 rows (Sun=0 … Sat=6)
  const grid: HeatmapCell[][] = Array.from({ length: weeks }, () =>
    Array.from({ length: 7 }, () => ({ date: '', count: 0, isEmpty: true })),
  )

  const totalDays = weeks * 7
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = toISODate(d)
    const week = Math.floor(i / 7)
    const day = d.getDay() // 0=Sun, 6=Sat

    const col = grid[week]
    if (col) {
      col[day] = {
        date: dateStr,
        count: entryMap.get(dateStr) ?? 0,
        isEmpty: false,
      }
    }
  }

  return grid
}

export function heatmapColorClass(count: number): string {
  if (count === 0) return 'bg-muted/60'
  if (count === 1) return 'bg-primary/30'
  if (count === 2) return 'bg-primary/55'
  return 'bg-primary/85'
}

export function formatLogDate(date: string): string {
  return formatDate(date, { day: '2-digit', month: 'short', year: undefined })
}

export function getCompletionRateLabel(rate: number): string {
  if (rate == null || isNaN(rate)) return '0%'
  return `${Math.round(rate)}%`
}
