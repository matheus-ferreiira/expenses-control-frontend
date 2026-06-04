import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { bookmarksApi } from '@/services/api/bookmarks'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import type { Bookmark, CreateBookmarkPayload, ReorderItem, UpdateBookmarkPayload } from '@/types/bookmarks'

export const useBookmarkStore = defineStore('bookmarks', () => {
  const bookmarks = ref<Bookmark[]>([])
  const activeCollectionId = ref<string | null>(null)
  const isLoading = ref(false)
  const searchTerm = ref('')
  const showFavoritesOnly = ref(false)

  const filteredBookmarks = computed(() => {
    let result = bookmarks.value
    if (searchTerm.value.trim()) {
      const term = searchTerm.value.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(term) ||
          b.url.toLowerCase().includes(term) ||
          (b.description?.toLowerCase().includes(term) ?? false),
      )
    }
    if (showFavoritesOnly.value) {
      result = result.filter((b) => b.is_favorite)
    }
    return result
  })

  async function fetchBookmarks(collectionId: string): Promise<void> {
    activeCollectionId.value = collectionId
    isLoading.value = true
    try {
      bookmarks.value = await bookmarksApi.links.list(collectionId)
    } finally {
      isLoading.value = false
    }
  }

  async function createBookmark(collectionId: string, payload: CreateBookmarkPayload): Promise<Bookmark> {
    const bookmark = await bookmarksApi.links.create(collectionId, payload)
    bookmarks.value.unshift(bookmark)
    useBookmarkCollectionStore().patchBookmarksCount(collectionId, 1)
    return bookmark
  }

  async function updateBookmark(id: string, payload: UpdateBookmarkPayload): Promise<void> {
    const updated = await bookmarksApi.links.update(id, payload)
    const idx = bookmarks.value.findIndex((b) => b.id === id)
    if (idx !== -1) bookmarks.value[idx] = updated
  }

  async function deleteBookmark(id: string): Promise<void> {
    const bookmark = bookmarks.value.find((b) => b.id === id)
    await bookmarksApi.links.delete(id)
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
    if (bookmark) {
      useBookmarkCollectionStore().patchBookmarksCount(bookmark.bookmark_collection_id, -1)
    }
  }

  async function toggleFavorite(id: string): Promise<void> {
    const bookmark = bookmarks.value.find((b) => b.id === id)
    if (bookmark) bookmark.is_favorite = !bookmark.is_favorite
    try {
      const updated = await bookmarksApi.links.toggleFavorite(id)
      const idx = bookmarks.value.findIndex((b) => b.id === id)
      if (idx !== -1) bookmarks.value[idx] = updated
    } catch {
      if (bookmark) bookmark.is_favorite = !bookmark.is_favorite
      throw new Error('toggle failed')
    }
  }

  async function reorderBookmarks(collectionId: string, items: ReorderItem[]): Promise<void> {
    await bookmarksApi.links.reorder(collectionId, items)
    items.forEach(({ id, position }) => {
      const b = bookmarks.value.find((bm) => bm.id === id)
      if (b) b.position = position
    })
    bookmarks.value.sort((a, b) => a.position - b.position)
  }

  function setSearch(term: string): void {
    searchTerm.value = term
  }

  function toggleFavoritesFilter(): void {
    showFavoritesOnly.value = !showFavoritesOnly.value
  }

  function clearCollection(): void {
    bookmarks.value = []
    activeCollectionId.value = null
    searchTerm.value = ''
    showFavoritesOnly.value = false
  }

  return {
    bookmarks,
    activeCollectionId,
    isLoading,
    searchTerm,
    showFavoritesOnly,
    filteredBookmarks,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    reorderBookmarks,
    setSearch,
    toggleFavoritesFilter,
    clearCollection,
  }
})
