<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useKeyboardShortcut } from '@/composables/useKeyboardShortcut'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import CommandPalette from '@/components/shared/CommandPalette.vue'
import QuickAddDialog from '@/components/shared/QuickAddDialog.vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Menu, LayoutDashboard, CheckSquare, Flame, CreditCard, Plus } from 'lucide-vue-next'
import { ROUTES } from '@/constants/routes'

const ui = useUiStore()
const route = useRoute()
const router = useRouter()
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

const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Hoje', route: ROUTES.DASHBOARD },
  { icon: CheckSquare, label: 'Tarefas', route: ROUTES.TASKS },
  { icon: CreditCard, label: 'Finanças', route: ROUTES.FINANCE },
  { icon: Flame, label: 'Hábitos', route: ROUTES.HABITS },
] as const

function isNavActive(routeName: string) {
  return route.name === routeName
}

function navTo(routeName: string) {
  router.push({ name: routeName })
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
          class="p-1.5 rounded-md transition-base"
          style="color: hsl(var(--muted-foreground) / 0.6)"
          @click="mobileMenuOpen = true"
        >
          <Menu :size="18" />
        </button>
        <span class="text-[14px] font-semibold text-foreground">Vault</span>
      </div>

      <!-- Page content — extra bottom padding on mobile for bottom nav -->
      <main class="flex-1 overflow-auto pb-[64px] md:pb-0">
        <RouterView />
      </main>
    </div>

    <!-- ─── Mobile bottom navigation ───────────────────────── -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center h-16"
      style="background: hsl(var(--card)); border-top: 1px solid hsl(var(--border) / 0.6)"
    >
      <!-- Left 2 items -->
      <div class="flex flex-1 items-center justify-around">
        <button
          v-for="item in bottomNavItems.slice(0, 2)"
          :key="item.route"
          class="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px] transition-colors"
          :style="isNavActive(item.route)
            ? 'color: hsl(var(--foreground))'
            : 'color: hsl(var(--muted-foreground) / 0.5)'"
          @click="navTo(item.route)"
        >
          <component :is="item.icon" :size="20" />
          <span class="text-[10px] font-medium">{{ item.label }}</span>
        </button>
      </div>

      <!-- FAB center -->
      <div class="flex-shrink-0 flex items-center justify-center w-20">
        <button
          class="flex items-center justify-center w-13 h-13 rounded-full shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
          style="background: #3b82f6; color: #fff; width: 52px; height: 52px"
          @click="ui.quickAddOpen = true"
        >
          <Plus :size="24" />
        </button>
      </div>

      <!-- Right 2 items -->
      <div class="flex flex-1 items-center justify-around">
        <button
          v-for="item in bottomNavItems.slice(2)"
          :key="item.route"
          class="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px] transition-colors"
          :style="isNavActive(item.route)
            ? 'color: hsl(var(--foreground))'
            : 'color: hsl(var(--muted-foreground) / 0.5)'"
          @click="navTo(item.route)"
        >
          <component :is="item.icon" :size="20" />
          <span class="text-[10px] font-medium">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- ─── Global overlays ──────────────────────────────────── -->
    <CommandPalette />
    <QuickAddDialog />
  </div>
</template>
