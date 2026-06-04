import { ref } from 'vue'
import { defineStore } from 'pinia'
import { bookmarksApi } from '@/services/api/bookmarks'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import type { Bookmark, CreateBookmarkPayload, ReorderItem, UpdateBookmarkPayload } from '@/types/bookmarks'

export const useBookmarkStore = defineStore('bookmarks', () => {
  const bookmarks = ref<Bookmark[]>([])
  const isLoading = ref(false)
  const searchTerm = ref('')
  const showFavoritesOnly = ref(false)

  async function fetchBookmarks(categoryId: string): Promise<void> {
    isLoading.value = true
    try {
      bookmarks.value = await bookmarksApi.bookmarks.list(categoryId, {
        search: searchTerm.value || undefined,
        favorites: showFavoritesOnly.value || undefined,
      })
    } finally {
      isLoading.value = false
    }
  }

  async function createBookmark(categoryId: string, payload: CreateBookmarkPayload): Promise<Bookmark> {
    const bookmark = await bookmarksApi.bookmarks.create(categoryId, payload)
    bookmarks.value.unshift(bookmark)
    useBookmarkCollectionStore().patchCategoryBookmarksCount(categoryId, 1)
    return bookmark
  }

  async function updateBookmark(id: string, payload: UpdateBookmarkPayload): Promise<void> {
    const updated = await bookmarksApi.bookmarks.update(id, payload)
    const idx = bookmarks.value.findIndex((b) => b.id === id)
    if (idx !== -1) bookmarks.value[idx] = updated
  }

  async function deleteBookmark(id: string): Promise<void> {
    const bookmark = bookmarks.value.find((b) => b.id === id)
    await bookmarksApi.bookmarks.delete(id)
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
    if (bookmark) {
      useBookmarkCollectionStore().patchCategoryBookmarksCount(bookmark.bookmark_category_id, -1)
    }
  }

  async function toggleFavorite(id: string): Promise<void> {
    const updated = await bookmarksApi.bookmarks.toggleFavorite(id)
    const idx = bookmarks.value.findIndex((b) => b.id === id)
    if (idx !== -1) bookmarks.value[idx] = updated
  }

  async function reorderBookmarks(categoryId: string, items: ReorderItem[]): Promise<void> {
    await bookmarksApi.bookmarks.reorder(categoryId, items)
    items.forEach(({ id, position }) => {
      const b = bookmarks.value.find((bm) => bm.id === id)
      if (b) b.position = position
    })
    bookmarks.value.sort((a, b) => a.position - b.position)
  }

  function setSearch(term: string): void {
    searchTerm.value = term
  }

  function setShowFavoritesOnly(val: boolean): void {
    showFavoritesOnly.value = val
  }

  function clear(): void {
    bookmarks.value = []
    searchTerm.value = ''
    showFavoritesOnly.value = false
  }

  return {
    bookmarks,
    isLoading,
    searchTerm,
    showFavoritesOnly,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    reorderBookmarks,
    setSearch,
    setShowFavoritesOnly,
    clear,
  }
})
