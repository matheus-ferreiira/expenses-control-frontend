import { ref, computed } from 'vue'
import type { PaginationMeta } from '@/types/api'

export function usePagination(initialPage = 1, initialPerPage = 15) {
  const page = ref(initialPage)
  const perPage = ref(initialPerPage)
  const meta = ref<PaginationMeta | null>(null)

  const hasNextPage = computed(() =>
    meta.value ? meta.value.current_page < meta.value.last_page : false,
  )

  const hasPrevPage = computed(() => (meta.value ? meta.value.current_page > 1 : false))

  const totalPages = computed(() => meta.value?.last_page ?? 1)

  function setMeta(newMeta: PaginationMeta) {
    meta.value = newMeta
    page.value = newMeta.current_page
  }

  function nextPage() {
    if (hasNextPage.value) page.value++
  }

  function prevPage() {
    if (hasPrevPage.value) page.value--
  }

  function goToPage(p: number) {
    page.value = Math.max(1, Math.min(p, totalPages.value))
  }

  function reset() {
    page.value = initialPage
    meta.value = null
  }

  return {
    page,
    perPage,
    meta,
    hasNextPage,
    hasPrevPage,
    totalPages,
    setMeta,
    nextPage,
    prevPage,
    goToPage,
    reset,
  }
}
