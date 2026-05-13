import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

type Theme = 'dark' | 'light'

function applyTheme(theme: Theme) {
  const html = document.documentElement
  if (theme === 'light') {
    html.classList.add('light')
    html.classList.remove('dark')
  } else {
    html.classList.remove('light')
    html.classList.add('dark')
  }
}

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const globalLoading = ref(false)
  const commandOpen = ref(false)
  const quickAddOpen = ref(false)

  const savedTheme = (localStorage.getItem('vault:theme') as Theme | null) ?? 'dark'
  const theme = ref<Theme>(savedTheme)
  applyTheme(theme.value)

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

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('vault:theme', theme.value)
    applyTheme(theme.value)
  }

  return {
    sidebarOpen,
    globalLoading,
    commandOpen,
    quickAddOpen,
    theme,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    setGlobalLoading,
    toggleTheme,
  }
})
