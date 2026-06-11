import { ref } from 'vue'
import { defineStore } from 'pinia'
import { taskListsApi, type CreateTaskListPayload, type UpdateTaskListPayload } from '@/services/api/taskLists'
import type { TaskList } from '@/types/tasks'

export const useTaskListStore = defineStore('taskLists', () => {
  const lists = ref<TaskList[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLists(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      lists.value = await taskListsApi.list()
    } catch (e: unknown) {
      error.value = 'Erro ao carregar listas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createList(payload: CreateTaskListPayload): Promise<TaskList> {
    const list = await taskListsApi.create(payload)
    if (payload.is_default) {
      lists.value = lists.value.map((l) => ({ ...l, is_default: false }))
    }
    lists.value.push(list)
    return list
  }

  async function updateList(id: string, payload: UpdateTaskListPayload): Promise<TaskList> {
    const updated = await taskListsApi.update(id, payload)
    if (payload.is_default) {
      lists.value = lists.value.map((l) => ({ ...l, is_default: l.id === id }))
    } else {
      const idx = lists.value.findIndex((l) => l.id === id)
      if (idx !== -1) lists.value[idx] = updated
    }
    return updated
  }

  async function deleteList(id: string): Promise<void> {
    await taskListsApi.delete(id)
    lists.value = lists.value.filter((l) => l.id !== id)
  }

  return { lists, loading, error, fetchLists, createList, updateList, deleteList }
})
