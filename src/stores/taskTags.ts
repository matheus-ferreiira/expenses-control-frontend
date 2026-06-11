import { ref } from 'vue'
import { defineStore } from 'pinia'
import { taskTagsApi, type CreateTaskTagPayload, type UpdateTaskTagPayload } from '@/services/api/taskTags'
import type { TaskTag } from '@/types/tasks'

export const useTaskTagStore = defineStore('taskTags', () => {
  const tags = ref<TaskTag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTags(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      tags.value = await taskTagsApi.list()
    } catch (e: unknown) {
      error.value = 'Erro ao carregar tags'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createTag(payload: CreateTaskTagPayload): Promise<TaskTag> {
    const tag = await taskTagsApi.create(payload)
    tags.value.push(tag)
    return tag
  }

  async function updateTag(id: string, payload: UpdateTaskTagPayload): Promise<TaskTag> {
    const updated = await taskTagsApi.update(id, payload)
    const idx = tags.value.findIndex((t) => t.id === id)
    if (idx !== -1) tags.value[idx] = updated
    return updated
  }

  async function deleteTag(id: string): Promise<void> {
    await taskTagsApi.delete(id)
    tags.value = tags.value.filter((t) => t.id !== id)
  }

  return { tags, loading, error, fetchTags, createTag, updateTag, deleteTag }
})
