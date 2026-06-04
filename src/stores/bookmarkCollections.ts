import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { bookmarksApi } from '@/services/api/bookmarks'
import type {
  BookmarkCategory,
  BookmarkCollection,
  CreateBookmarkCategoryPayload,
  CreateBookmarkCollectionPayload,
  ReorderItem,
  UpdateBookmarkCategoryPayload,
  UpdateBookmarkCollectionPayload,
} from '@/types/bookmarks'

export const useBookmarkCollectionStore = defineStore('bookmarkCollections', () => {
  const collections = ref<BookmarkCollection[]>([])
  const loading = ref(false)
  const activeCollectionId = ref<string | null>(null)
  const activeCategoryId = ref<string | null>(null)

  const activeCollection = computed<BookmarkCollection | null>(
    () => collections.value.find((c) => c.id === activeCollectionId.value) ?? null,
  )

  const activeCategories = computed<BookmarkCategory[]>(
    () => activeCollection.value?.categories ?? [],
  )

  // ── Collections ────────────────────────────────────────────────────────────

  async function fetchCollections(): Promise<void> {
    loading.value = true
    try {
      collections.value = await bookmarksApi.collections.list()
      if (!activeCollectionId.value && collections.value.length > 0) {
        activeCollectionId.value = collections.value[0]!.id
      }
    } finally {
      loading.value = false
    }
  }

  async function createCollection(payload: CreateBookmarkCollectionPayload): Promise<BookmarkCollection> {
    const collection = await bookmarksApi.collections.create(payload)
    collections.value.push({ ...collection, categories: [] })
    return collection
  }

  async function updateCollection(id: string, payload: UpdateBookmarkCollectionPayload): Promise<void> {
    const updated = await bookmarksApi.collections.update(id, payload)
    const idx = collections.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      const categories = collections.value[idx]!.categories
      collections.value[idx] = { ...updated, categories }
    }
  }

  async function deleteCollection(id: string): Promise<void> {
    await bookmarksApi.collections.delete(id)
    collections.value = collections.value.filter((c) => c.id !== id)
    if (activeCollectionId.value === id) {
      activeCollectionId.value = collections.value[0]?.id ?? null
      activeCategoryId.value = null
    }
  }

  async function reorderCollections(items: ReorderItem[]): Promise<void> {
    await bookmarksApi.collections.reorder(items)
    items.forEach(({ id, position }) => {
      const col = collections.value.find((c) => c.id === id)
      if (col) col.position = position
    })
    collections.value.sort((a, b) => a.position - b.position)
  }

  function setActiveCollection(id: string): void {
    activeCollectionId.value = id
    activeCategoryId.value = null
  }

  function setActiveCategory(id: string | null): void {
    activeCategoryId.value = id
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async function createCategory(collectionId: string, payload: CreateBookmarkCategoryPayload): Promise<BookmarkCategory> {
    const category = await bookmarksApi.categories.create(collectionId, payload)
    const col = collections.value.find((c) => c.id === collectionId)
    if (col) {
      if (!col.categories) col.categories = []
      col.categories.push(category)
    }
    return category
  }

  async function updateCategory(id: string, payload: UpdateBookmarkCategoryPayload): Promise<void> {
    const updated = await bookmarksApi.categories.update(id, payload)
    for (const col of collections.value) {
      if (!col.categories) continue
      const idx = col.categories.findIndex((c) => c.id === id)
      if (idx !== -1) {
        col.categories[idx] = updated
        break
      }
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    await bookmarksApi.categories.delete(id)
    for (const col of collections.value) {
      if (!col.categories) continue
      const idx = col.categories.findIndex((c) => c.id === id)
      if (idx !== -1) {
        col.categories.splice(idx, 1)
        break
      }
    }
    if (activeCategoryId.value === id) {
      activeCategoryId.value = null
    }
  }

  function patchCollectionBookmarksCount(collectionId: string, delta: number): void {
    const col = collections.value.find((c) => c.id === collectionId)
    if (col) col.bookmarks_count = Math.max(0, (col.bookmarks_count ?? 0) + delta)
  }

  function patchCategoryBookmarksCount(categoryId: string, delta: number): void {
    for (const col of collections.value) {
      if (!col.categories) continue
      const cat = col.categories.find((c) => c.id === categoryId)
      if (cat) {
        cat.bookmarks_count = Math.max(0, (cat.bookmarks_count ?? 0) + delta)
        patchCollectionBookmarksCount(col.id, delta)
        break
      }
    }
  }

  return {
    collections,
    loading,
    activeCollectionId,
    activeCategoryId,
    activeCollection,
    activeCategories,
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    reorderCollections,
    setActiveCollection,
    setActiveCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    patchCategoryBookmarksCount,
  }
})
