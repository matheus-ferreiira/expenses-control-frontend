import { ref } from 'vue'
import type { BookmarkCollection, BookmarkCategory } from '@/types/bookmarks'

export function useBookmarkCollections() {

  const collectionDialogOpen = ref(false)
  const categoryDialogOpen = ref(false)
  const editingCollection = ref<BookmarkCollection | null>(null)
  const editingCategory = ref<BookmarkCategory | null>(null)

  function openNewCollection() {
    editingCollection.value = null
    collectionDialogOpen.value = true
  }

  function openEditCollection(collection: BookmarkCollection) {
    editingCollection.value = collection
    collectionDialogOpen.value = true
  }

  function openNewCategory() {
    editingCategory.value = null
    categoryDialogOpen.value = true
  }

  function openEditCategory(category: BookmarkCategory) {
    editingCategory.value = category
    categoryDialogOpen.value = true
  }

  return {
    collectionDialogOpen,
    categoryDialogOpen,
    editingCollection,
    editingCategory,
    openNewCollection,
    openEditCollection,
    openNewCategory,
    openEditCategory,
  }
}
