<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useKeyboardShortcut } from '@/composables/useKeyboardShortcut'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import CommandPalette from '@/components/shared/CommandPalette.vue'
import QuickAddDialog from '@/components/shared/QuickAddDialog.vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Menu, Search, LayoutDashboard, CheckSquare, Activity, DollarSign, Plus } from 'lucide-vue-next'
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

const bottomNavLeft = [
  { icon: LayoutDashboard, label: 'Hoje', route: ROUTES.DASHBOARD },
  { icon: CheckSquare, label: 'Tarefas', route: ROUTES.TASKS },
] as const

const bottomNavRight = [
  { icon: DollarSign, label: 'Finanças', route: ROUTES.FINANCE },
  { icon: Activity, label: 'Hábitos', route: ROUTES.HABITS },
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
          @navigate="mobileMenuOpen = false"
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
        class="md:hidden flex items-center h-11 px-4 shrink-0"
        style="border-bottom: 1px solid hsl(var(--border)); background: hsl(var(--background) / 0.95)"
      >
        <button
          class="p-1 rounded-md transition-base shrink-0"
          style="color: hsl(var(--muted-foreground) / 0.5)"
          @click="mobileMenuOpen = true"
        >
          <Menu :size="17" />
        </button>
        <span class="flex-1 text-center text-[14px] font-semibold text-foreground">Vault</span>
        <button
          class="p-1 rounded-md transition-base shrink-0"
          style="color: hsl(var(--muted-foreground) / 0.5)"
          @click="ui.commandOpen = true"
        >
          <Search :size="17" />
        </button>
      </div>

      <!-- Page content — extra bottom padding on mobile for bottom nav -->
      <main class="flex-1 overflow-auto pb-[64px] md:pb-0">
        <RouterView />
      </main>
    </div>

    <!-- ─── Mobile bottom navigation ───────────────────────── -->
    <nav
      class="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-sidebar-border backdrop-blur"
      style="background: hsl(var(--sidebar) / 0.95)"
    >
      <div class="relative grid grid-cols-5 h-16">
        <!-- Left 2 items -->
        <button
          v-for="item in bottomNavLeft"
          :key="item.route"
          class="flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium min-h-[56px] transition-colors"
          :style="isNavActive(item.route) ? 'color: hsl(var(--foreground))' : 'color: hsl(var(--muted-foreground))'"
          @click="navTo(item.route)"
        >
          <component
            :is="item.icon"
            :size="20"
            :stroke-width="isNavActive(item.route) ? 2.25 : 1.75"
          />
          {{ item.label }}
        </button>

        <!-- FAB center — protrudes 24px above the bar -->
        <div class="relative">
          <button
            class="absolute left-1/2 -translate-x-1/2 -top-6 size-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg ring-4 ring-background active:scale-95 transition-transform"
            aria-label="Adicionar"
            @click="ui.quickAddOpen = true"
          >
            <Plus :size="24" :stroke-width="2.5" />
          </button>
        </div>

        <!-- Right 2 items -->
        <button
          v-for="item in bottomNavRight"
          :key="item.route"
          class="flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium min-h-[56px] transition-colors"
          :style="isNavActive(item.route) ? 'color: hsl(var(--foreground))' : 'color: hsl(var(--muted-foreground))'"
          @click="navTo(item.route)"
        >
          <component
            :is="item.icon"
            :size="20"
            :stroke-width="isNavActive(item.route) ? 2.25 : 1.75"
          />
          {{ item.label }}
        </button>
      </div>
    </nav>

    <!-- ─── Global overlays ──────────────────────────────────── -->
    <CommandPalette />
    <QuickAddDialog />
  </div>
</template>
