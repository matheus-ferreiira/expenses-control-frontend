<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useKeyboardShortcut } from '@/composables/useKeyboardShortcut'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import CommandPalette from '@/components/shared/CommandPalette.vue'
import QuickAddDialog from '@/components/shared/QuickAddDialog.vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Menu } from 'lucide-vue-next'

const ui = useUiStore()
useKeyboardShortcut()

const mobileMenuOpen = ref(false)

function openSearch() {
  mobileMenuOpen.value = false
  ui.commandOpen = true
}

function openQuickAdd() {
  mobileMenuOpen.value = false
  ui.quickAddOpen = true
}
</script>

<template>
  <div class="min-h-screen bg-background flex">

    <!-- ─── Desktop sidebar (md+) ─────────────────────────────── -->
    <div class="hidden md:flex fixed inset-y-0 left-0 z-40">
      <AppSidebar
        :open="ui.sidebarOpen"
        @toggle="ui.toggleSidebar"
        @search="ui.commandOpen = true"
        @quick-add="ui.quickAddOpen = true"
      />
    </div>

    <!-- ─── Mobile sidebar (Sheet) ───────────────────────────── -->
    <Sheet v-model:open="mobileMenuOpen">
      <SheetContent
        side="left"
        class="p-0 border-r-0 w-[220px] max-w-[220px] [&>button]:hidden"
      >
        <AppSidebar
          :open="true"
          @toggle="mobileMenuOpen = false"
          @search="openSearch"
          @quick-add="openQuickAdd"
        />
      </SheetContent>
    </Sheet>

    <!-- ─── Main area ─────────────────────────────────────────── -->
    <div
      class="flex flex-col flex-1 min-w-0 min-h-screen transition-[margin] duration-300 ease-in-out"
      :class="ui.sidebarOpen ? 'md:ml-[220px]' : 'md:ml-[52px]'"
    >
      <!-- Mobile top bar (only on small screens) -->
      <div
        class="md:hidden flex items-center h-12 px-4 gap-3 shrink-0"
        style="border-bottom: 1px solid hsl(var(--border)); background: hsl(var(--background) / 0.95)"
      >
        <button
          class="p-1.5 rounded-md transition-colors"
          style="color: hsl(var(--muted-foreground) / 0.6)"
          @click="mobileMenuOpen = true"
        >
          <Menu :size="18" />
        </button>
        <span class="text-[14px] font-semibold text-foreground">Vault</span>
      </div>

      <!-- Page content -->
      <main class="flex-1 overflow-auto">
        <RouterView />
      </main>
    </div>

    <!-- ─── Global overlays ──────────────────────────────────── -->
    <CommandPalette />
    <QuickAddDialog />
  </div>
</template>
