<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { Menu } from 'lucide-vue-next'

const auth = useAuthStore()
const ui = useUiStore()
</script>

<template>
  <header
    class="h-16 flex items-center gap-4 px-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30"
  >
    <button
      class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      @click="ui.toggleSidebar"
    >
      <Menu :size="18" />
    </button>

    <div class="flex-1" />

    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">{{ auth.user?.name ?? '' }}</span>
      <div
        class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium"
      >
        {{ auth.user?.name?.[0]?.toUpperCase() ?? '?' }}
      </div>
    </div>
  </header>
</template>
