import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useBookmarkStore } from '@/stores/bookmarks'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import type { Bookmark } from '@/types/bookmarks'

export function useBookmarks() {
  const bookmarkStore = useBookmarkStore()
  const collectionStore = useBookmarkCollectionStore()

  const addDialogOpen = ref(false)
  const editDialogOpen = ref(false)
  const editingBookmark = ref<Bookmark | null>(null)

  async function loadBookmarks() {
    const categoryId = collectionStore.activeCategoryId
    if (!categoryId) return

    await bookmarkStore.fetchBookmarks(categoryId)
  }

  const debouncedSearch = useDebounceFn(async () => {
    await loadBookmarks()
  }, 300)

  function onSearch(term: string) {
    bookmarkStore.setSearch(term)
    debouncedSearch()
  }

  async function toggleFavoritesFilter() {
    bookmarkStore.setShowFavoritesOnly(!bookmarkStore.showFavoritesOnly)
    await loadBookmarks()
  }

  function openEdit(bookmark: Bookmark) {
    editingBookmark.value = bookmark
    editDialogOpen.value = true
  }

  watch(
    () => [collectionStore.activeCategoryId, collectionStore.activeCollectionId],
    async () => {
      bookmarkStore.clear()
      if (collectionStore.activeCategoryId) {
        await loadBookmarks()
      }
    },
  )

  return {
    addDialogOpen,
    editDialogOpen,
    editingBookmark,
    loadBookmarks,
    onSearch,
    toggleFavoritesFilter,
    openEdit,
  }
}
