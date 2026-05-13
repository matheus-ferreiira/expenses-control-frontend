import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const globalLoading = ref(false)

  const isSidebarOpen = computed(() => sidebarOpen.value)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setSidebarOpen(value: boolean) {
    sidebarOpen.value = value
  }

  function setGlobalLoading(value: boolean) {
    globalLoading.value = value
  }

  return {
    sidebarOpen,
    globalLoading,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    setGlobalLoading,
  }
})
