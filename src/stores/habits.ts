import { ref } from 'vue'
import { defineStore } from 'pinia'
import { habitsApi } from '@/services/api/habits'
import type { Habit, CreateHabitPayload, UpdateHabitPayload, LogHabitPayload } from '@/types/habits'

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
  }
})
