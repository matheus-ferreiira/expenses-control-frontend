import { ref } from 'vue'
import { defineStore } from 'pinia'
import { bookmarksApi } from '@/services/api/bookmarks'
import type {
  BookmarkCollection,
  CreateBookmarkCollectionPayload,
  ReorderItem,
  UpdateBookmarkCollectionPayload,
} from '@/types/bookmarks'

export const useBookmarkCollectionStore = defineStore('bookmarkCollections', () => {
  const collections = ref<BookmarkCollection[]>([])
  const isLoading = ref(false)

  async function fetchCollections(): Promise<void> {
    isLoading.value = true
    try {
      collections.value = await bookmarksApi.collections.list()
    } finally {
      isLoading.value = false
    }
  }

  async function createCollection(payload: CreateBookmarkCollectionPayload): Promise<BookmarkCollection> {
    const collection = await bookmarksApi.collections.create(payload)
    collections.value.unshift(collection)
    return collection
  }

  async function updateCollection(id: string, payload: UpdateBookmarkCollectionPayload): Promise<void> {
    const updated = await bookmarksApi.collections.update(id, payload)
    const idx = collections.value.findIndex((c) => c.id === id)
    if (idx !== -1) collections.value[idx] = updated
  }

  async function deleteCollection(id: string): Promise<void> {
    await bookmarksApi.collections.delete(id)
    collections.value = collections.value.filter((c) => c.id !== id)
  }

  async function reorderCollections(items: ReorderItem[]): Promise<void> {
    await bookmarksApi.collections.reorder(items)
    items.forEach(({ id, position }) => {
      const col = collections.value.find((c) => c.id === id)
      if (col) col.position = position
    })
    collections.value.sort((a, b) => a.position - b.position)
  }

  function patchBookmarksCount(collectionId: string, delta: number): void {
    const col = collections.value.find((c) => c.id === collectionId)
    if (col) col.bookmarks_count = Math.max(0, (col.bookmarks_count ?? 0) + delta)
  }

  return {
    collections,
    isLoading,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    reorderCollections,
    patchBookmarksCount,
  }
})
