import { ref } from 'vue'
import { defineStore } from 'pinia'
import { habitsApi } from '@/services/api/habits'
import type { Habit, CreateHabitPayload, UpdateHabitPayload, LogHabitPayload } from '@/types/habits'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { toISODate } from '@/utils/date'

export const useHabitStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([])
  const todayHabits = ref<Habit[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchHabits() {
    loading.value = true
    error.value = null
    try {
      habits.value = await habitsApi.list()
    } catch (e: unknown) {
      error.value = 'Erro ao carregar hábitos'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchToday() {
    todayHabits.value = await habitsApi.today()
  }

  async function createHabit(payload: CreateHabitPayload): Promise<Habit> {
    const habit = await habitsApi.create(payload)
    habits.value.unshift(habit)
    return habit
  }

  async function updateHabit(id: string, payload: UpdateHabitPayload): Promise<Habit> {
    const updated = await habitsApi.update(id, payload)
    const idx = habits.value.findIndex((h) => h.id === id)
    if (idx !== -1) habits.value[idx] = updated
    return updated
  }

  async function deleteHabit(id: string) {
    await habitsApi.delete(id)
    habits.value = habits.value.filter((h) => h.id !== id)
  }

  async function logHabit(id: string, payload?: LogHabitPayload): Promise<Habit> {
    const updated = await habitsApi.log(id, payload)
    const idx = habits.value.findIndex((h) => h.id === id)
    if (idx !== -1) habits.value[idx] = updated
    const todayIdx = todayHabits.value.findIndex((h) => h.id === id)
    if (todayIdx !== -1) todayHabits.value[todayIdx] = updated
    return updated
  }

  async function unlogHabit(id: string, date?: string) {
    await habitsApi.unlog(id, date)
    await fetchToday()
  }

  // Optimistic toggle: log if not done today, unlog if already done
  async function optimisticLog(id: string): Promise<void> {
    const idx = habits.value.findIndex((h) => h.id === id)
    if (idx === -1) return

    const habit = habits.value[idx] as Habit
    const alreadyDone = isCompletedToday(habit)
    const today = toISODate(new Date())

    if (alreadyDone) {
      // Optimistic unlog: remove today's log
      const prevLogs = [...habit.logs]
      const prevStreak = habit.current_streak
      habits.value[idx] = { ...habit, logs: habit.logs.filter((l) => l.completed_date !== today), current_streak: Math.max(0, habit.current_streak - 1) } as Habit
      try {
        await habitsApi.unlog(id, today)
        const updated = await habitsApi.get(id)
        habits.value[idx] = updated
      } catch {
        habits.value[idx] = { ...habit, logs: prevLogs, current_streak: prevStreak } as Habit
        throw new Error('Erro ao desmarcar hábito')
      }
    } else {
      // Optimistic log: add fake HabitLog entry
      const fakeLog = {
        id: `temp-${Date.now()}`,
        habit_id: id,
        completed_date: today,
        notes: null,
        created_at: new Date().toISOString(),
      }
      const prevLogs = [...habit.logs]
      const prevStreak = habit.current_streak
      habits.value[idx] = { ...habit, logs: [...habit.logs, fakeLog], current_streak: habit.current_streak + 1 } as Habit
      try {
        const updated = await habitsApi.log(id)
        habits.value[idx] = updated
      } catch {
        habits.value[idx] = { ...habit, logs: prevLogs, current_streak: prevStreak } as Habit
        throw new Error('Erro ao marcar hábito')
      }
    }

    // Sync todayHabits
    const todayIdx = todayHabits.value.findIndex((h) => h.id === id)
    const synced = habits.value[idx]
    if (todayIdx !== -1 && synced) {
      todayHabits.value[todayIdx] = synced
    }
  }

  async function archiveHabit(id: string): Promise<Habit> {
    const updated = await habitsApi.update(id, { is_active: false } as unknown as UpdateHabitPayload)
    const idx = habits.value.findIndex((h) => h.id === id)
    if (idx !== -1) habits.value[idx] = updated
    return updated
  }

  return {
    habits,
    todayHabits,
    loading,
    error,
    fetchHabits,
    fetchToday,
    createHabit,
    updateHabit,
    deleteHabit,
    logHabit,
    unlogHabit,
    optimisticLog,
    archiveHabit,
  }
})
