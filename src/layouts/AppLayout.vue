<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { useKeyboardShortcut } from '@/composables/useKeyboardShortcut'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import AppHeader from '@/components/shared/AppHeader.vue'

const ui = useUiStore()
useKeyboardShortcut()
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <AppSidebar :open="ui.sidebarOpen" @toggle="ui.toggleSidebar" />

    <div
      class="flex flex-col flex-1 min-w-0 transition-all duration-300"
      :class="ui.sidebarOpen ? 'ml-64' : 'ml-16'"
    >
      <AppHeader />

      <main class="flex-1 p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
