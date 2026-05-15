import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { goalsApi } from '@/services/api/goals'
import type { Goal, CreateGoalPayload, UpdateGoalPayload } from '@/types/goals'

export const useGoalStore = defineStore('goals', () => {
  const goals = ref<Goal[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeGoals = computed(() => goals.value.filter((g) => g.status === 'active'))
  const completedGoals = computed(() => goals.value.filter((g) => g.status === 'completed'))

  async function fetchGoals() {
    loading.value = true
    error.value = null
    try {
      goals.value = await goalsApi.list()
    } catch (e: unknown) {
      error.value = 'Erro ao carregar metas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
    loading.value = true
    error.value = null
    try {
      const goal = await goalsApi.create(payload)
      goals.value.unshift(goal)
      return goal
    } catch (e: unknown) {
      error.value = 'Erro ao criar meta'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateGoal(id: string, payload: UpdateGoalPayload): Promise<Goal> {
    loading.value = true
    error.value = null
    try {
      const updated = await goalsApi.update(id, payload)
      const idx = goals.value.findIndex((g) => g.id === id)
      if (idx !== -1) goals.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar meta'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteGoal(id: string) {
    loading.value = true
    error.value = null
    try {
      await goalsApi.delete(id)
      goals.value = goals.value.filter((g) => g.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir meta'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateProgress(id: string, value: number): Promise<Goal> {
    loading.value = true
    error.value = null
    try {
      const updated = await goalsApi.updateProgress(id, { current_amount: value })
      const idx = goals.value.findIndex((g) => g.id === id)
      if (idx !== -1) goals.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar progresso'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    goals,
    loading,
    error,
    activeGoals,
    completedGoals,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
  }
})
