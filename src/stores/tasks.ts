import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { tasksApi } from '@/services/api/tasks'
import type { Task, TaskLabel, CreateTaskPayload, UpdateTaskPayload, TaskFilters } from '@/types/tasks'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const labels = ref<TaskLabel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  const pendingTasks = computed(() => tasks.value.filter((t) => t.status === 'pending'))
  const overdueTasks = computed(() =>
    tasks.value.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== 'completed' &&
        t.status !== 'cancelled',
    ),
  )

  async function fetchTasks(filters?: TaskFilters) {
    loading.value = true
    error.value = null
    try {
      const data = await tasksApi.list(filters)
      tasks.value = data as unknown as Task[]
    } catch (e: unknown) {
      error.value = 'Erro ao carregar tarefas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: CreateTaskPayload): Promise<Task> {
    const task = await tasksApi.create(payload)
    tasks.value.unshift(task)
    return task
  }

  async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const updated = await tasksApi.update(id, payload)
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) tasks.value[idx] = updated
    return updated
  }

  async function deleteTask(id: string) {
    await tasksApi.delete(id)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function fetchLabels() {
    labels.value = await tasksApi.labels.list()
  }

  return {
    tasks,
    labels,
    loading,
    error,
    total,
    pendingTasks,
    overdueTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    fetchLabels,
  }
})
