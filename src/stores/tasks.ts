import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { tasksApi } from '@/services/api/tasks'
import type {
  Task,
  TaskLabel,
  TaskStatus,
  Subtask,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from '@/types/tasks'

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
      const { data, meta } = await tasksApi.list(filters)
      tasks.value = data
      total.value = meta.total
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

  // Optimistic update: patches local state immediately, rolls back on API error
  async function optimisticUpdate(id: string, patch: UpdateTaskPayload): Promise<Task> {
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx === -1) return updateTask(id, patch)

    const prev = { ...tasks.value[idx] } as Task
    tasks.value[idx] = { ...tasks.value[idx], ...patch } as Task

    try {
      const updated = await tasksApi.update(id, patch)
      tasks.value[idx] = updated
      return updated
    } catch (e) {
      tasks.value[idx] = prev
      throw e
    }
  }

  async function toggleComplete(id: string): Promise<Task> {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) throw new Error('Task not found')
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    return optimisticUpdate(id, { status: nextStatus })
  }

  async function changeStatus(id: string, status: TaskStatus): Promise<Task> {
    return optimisticUpdate(id, { status })
  }

  async function archiveTask(id: string): Promise<void> {
    await tasksApi.archive(id)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function reorderTasks(ids: string[]): Promise<void> {
    const prev = [...tasks.value]
    // Reorder local array to match new order
    const ordered = ids
      .map((id) => tasks.value.find((t) => t.id === id))
      .filter((t): t is Task => !!t)
    const rest = tasks.value.filter((t) => !ids.includes(t.id))
    tasks.value = [...ordered, ...rest]

    try {
      await tasksApi.reorder(ids)
    } catch (e) {
      tasks.value = prev
      throw e
    }
  }

  // Subtask actions — mutate the subtasks array inside the parent task
  async function createSubtask(taskId: string, title: string): Promise<Subtask> {
    const subtask = await tasksApi.subtasks.create(taskId, title)
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      task.subtasks = [...task.subtasks, subtask]
      task.subtasks_count++
    }
    return subtask
  }

  async function toggleSubtask(taskId: string, subtaskId: string): Promise<void> {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return

    const sub = task.subtasks.find((s) => s.id === subtaskId)
    if (!sub) return

    const prevCompleted = sub.completed
    sub.completed = !sub.completed
    task.completed_subtasks_count += sub.completed ? 1 : -1

    try {
      await tasksApi.subtasks.update(taskId, subtaskId, { completed: sub.completed })
    } catch {
      sub.completed = prevCompleted
      task.completed_subtasks_count += sub.completed ? 1 : -1
    }
  }

  async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return

    const sub = task.subtasks.find((s) => s.id === subtaskId)
    const prevSubtasks = [...task.subtasks]
    const wasCompleted = sub?.completed ?? false

    task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId)
    task.subtasks_count--
    if (wasCompleted) task.completed_subtasks_count--

    try {
      await tasksApi.subtasks.delete(taskId, subtaskId)
    } catch {
      task.subtasks = prevSubtasks
      task.subtasks_count++
      if (wasCompleted) task.completed_subtasks_count++
    }
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
    optimisticUpdate,
    toggleComplete,
    changeStatus,
    archiveTask,
    reorderTasks,
    createSubtask,
    toggleSubtask,
    deleteSubtask,
  }
})
