<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useKeyboardShortcut } from '@/composables/useKeyboardShortcut'
import { useTransactionForm } from '@/composables/useTransactionForm'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import CommandPalette from '@/components/shared/CommandPalette.vue'
import QuickAddDialog from '@/components/shared/QuickAddDialog.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Search, LayoutDashboard, Calendar, DollarSign, AlignJustify, Plus } from 'lucide-vue-next'
import { ROUTES } from '@/constants/routes'

const ui = useUiStore()
const route = useRoute()
const router = useRouter()
useKeyboardShortcut()
const { transactionFormOpen, transactionFormPrefill } = useTransactionForm()

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
  { icon: Calendar, label: 'Agenda', route: ROUTES.TASKS },
] as const

const bottomNavRight = [
  { icon: DollarSign, label: 'Finanças', route: ROUTES.FINANCE },
] as const

/** Active: match exact route OR prefix for sub-routes (finance/*) */
function isNavActive(routeName: string) {
  const current = String(route.name)
  if (routeName === ROUTES.FINANCE) return current.startsWith('finance')
  if (routeName === ROUTES.TASKS) return current.startsWith('task')
  if (routeName === ROUTES.HABITS) return current.startsWith('habit')
  return current === routeName
}

function navTo(routeName: string) {
  router.push({ name: routeName })
}

/** Dynamic mobile header title based on current route */
const mobileHeaderTitle = computed(() => {
  const name = String(route.name)
  if (name.startsWith('finance')) return 'Finanças'
  if (name === ROUTES.DASHBOARD) return 'Hoje'
  if (name.startsWith('task')) return 'Agenda'
  if (name.startsWith('habit')) return 'Mais'
  if (name === ROUTES.GOALS || name === ROUTES.GOAL_DETAIL) return 'Metas'
  if (name === ROUTES.CALENDAR) return 'Calendário'
  if (name === ROUTES.REPORTS) return 'Relatórios'
  if (name === ROUTES.NOTES) return 'Notas'
  return 'Vault'
})
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
        class="p-0 border-r-0 w-full max-w-full [&>button]:hidden bg-background border-r"
      >
        <AppSidebar
          :open="true"
          :mobile="true"
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
      :class="ui.sidebarOpen ? 'md:ml-56' : 'md:ml-[52px]'"
    >
      <!-- Mobile top bar (only on small screens) -->
      <div class="md:hidden flex items-center h-11 px-4 shrink-0">
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-[15px] font-semibold text-foreground tracking-tight select-none">Vault</span>
          <span class="text-[9px] font-medium tracking-widest uppercase leading-none px-1 py-0.5 rounded  select-none text-muted-foreground border-border">Beta</span>
        </div>
        <span class="flex-1 text-center text-[14px] font-semibold text-foreground">{{ mobileHeaderTitle }}</span>
        <button
          class="p-1 rounded-md transition-all shrink-0 text-muted-foreground"
          @click="ui.commandOpen = true"
        >
          <Search :size="17" />
        </button>
      </div>

      <!-- Page content — extra bottom padding on mobile for bottom nav -->
      <main class="flex-1 overflow-auto pb-[64px] md:pb-0">
        <!-- Transição de rota via animation + :key — <Transition> exigiria raiz única,
             e várias páginas têm sheets como irmãos no root do template -->
        <RouterView v-slot="{ Component }">
          <div :key="String(route.name)" class="page-enter">
            <component :is="Component" />
          </div>
        </RouterView>
      </main>
    </div>

    <!-- ─── Mobile bottom navigation ───────────────────────── -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background backdrop-blur-md">
      <div class="relative grid grid-cols-5 h-16">
        <!-- Left 2 items -->
        <button
          v-for="item in bottomNavLeft"
          :key="item.route"
          class="flex flex-col items-center justify-center gap-0.5 h-full text-[10px] min-h-[56px] transition-colors border-t-2"
          :class="isNavActive(item.route)
            ? 'border-primary text-primary font-semibold'
            : 'border-transparent text-muted-foreground font-medium'"
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
            class="absolute left-1/2 -translate-x-1/2 -top-6 size-14 rounded-full bg-primary text-primary-foreground grid place-items-center   ring-2 ring-background active:scale-95 transition-transform"
            aria-label="Adicionar"
            @click="ui.quickAddOpen = true"
          >
            <Plus :size="24" :stroke-width="2.5" />
          </button>
        </div>

        <!-- Right items -->
        <button
          v-for="item in bottomNavRight"
          :key="item.route"
          class="flex flex-col items-center justify-center gap-0.5 h-full text-[10px] min-h-[56px] transition-colors border-t-2"
          :class="isNavActive(item.route)
            ? 'border-primary text-primary font-semibold'
            : 'border-transparent text-muted-foreground font-medium'"
          @click="navTo(item.route)"
        >
          <component
            :is="item.icon"
            :size="20"
            :stroke-width="isNavActive(item.route) ? 2.25 : 1.75"
          />
          {{ item.label }}
        </button>

        <!-- "Mais" — opens mobile sidebar -->
        <button
          class="flex flex-col items-center justify-center gap-0.5 h-full text-[10px] min-h-[56px] transition-colors border-t-2 border-transparent text-muted-foreground font-medium"
          @click="mobileMenuOpen = true"
        >
          <AlignJustify :size="20" :stroke-width="1.75" />
          Mais
        </button>
      </div>
    </nav>

    <!-- ─── Global overlays ──────────────────────────────────── -->
    <CommandPalette />
    <QuickAddDialog />
    <TransactionFormDialog
      :open="transactionFormOpen"
      :prefill="transactionFormPrefill"
      @update:open="transactionFormOpen = $event"
    />
  </div>
</template>

<style scoped>
@keyframes page-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

.page-enter {
  animation: page-in 150ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter {
    animation: none;
  }
}
</style>
