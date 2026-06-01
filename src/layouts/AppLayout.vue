<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useKeyboardShortcut } from '@/composables/useKeyboardShortcut'
import { useTransactionForm } from '@/composables/useTransactionForm'
import { useFinanceStore } from '@/stores/finance'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import CommandPalette from '@/components/shared/CommandPalette.vue'
import QuickAddDialog from '@/components/shared/QuickAddDialog.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Search, LayoutDashboard, Calendar, DollarSign, AlignJustify, Plus, Wallet } from 'lucide-vue-next'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/utils/currency'

const ui = useUiStore()
const route = useRoute()
const router = useRouter()
useKeyboardShortcut()
const { transactionFormOpen, transactionFormPrefill } = useTransactionForm()

const financeStore = useFinanceStore()
const balanceOpen = ref(false)
const totalBalance = computed(() => financeStore.activeAccounts.reduce((s, a) => s + a.balance, 0))

onMounted(() => {
  if (!financeStore.accounts.length) financeStore.fetchAccounts()
})

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
        class="p-0 border-r-0 w-full max-w-full [&>button]:hidden bg-background border-r border-primary/20"
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
      <div class="md:hidden flex items-center h-11 px-4 gap-2 shrink-0">
        <!-- Logo -->
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-[15px] font-semibold text-foreground tracking-tight select-none">Vault</span>
          <span class="text-[9px] font-medium tracking-widest uppercase leading-none px-1 py-0.5 rounded border select-none text-muted-foreground/40 border-border">Beta</span>
        </div>
        <!-- Page title -->
        <span class="flex-1 text-center text-[14px] font-semibold text-foreground">{{ mobileHeaderTitle }}</span>
        <!-- Balance widget with popover -->
        <Popover v-model:open="balanceOpen">
          <PopoverTrigger as-child>
            <button type="button" class="flex items-center gap-1 shrink-0 cursor-pointer">
              <Wallet :size="15" class="text-muted-foreground/50" />
              <span class="tabular-nums font-semibold text-[13px] text-foreground">{{ formatCurrency(totalBalance) }}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent class="w-64" align="end" :side-offset="8">
            <!-- Header -->
            <div class="mb-3">
              <p class="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">Saldo total</p>
              <p
                class="text-[22px] font-bold tabular-nums leading-none"
                :class="totalBalance >= 0 ? 'text-success' : 'text-destructive'"
              >{{ formatCurrency(totalBalance) }}</p>
            </div>
            <!-- Account list -->
            <div class="border-t border-border/40 pt-3">
              <p v-if="!financeStore.activeAccounts.length" class="text-[12px] text-muted-foreground/50">
                Nenhuma conta ativa
              </p>
              <div
                v-for="account in financeStore.activeAccounts"
                :key="account.id"
                class="flex items-center gap-2 py-2 border-b border-border/20 last:border-0"
              >
                <span
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0"
                  :style="{
                    background: (account.color || 'hsl(var(--primary))') + '26',
                    color: account.color || 'hsl(var(--primary))',
                  }"
                >{{ account.name.slice(0, 2).toUpperCase() }}</span>
                <span class="flex-1 text-[13px] font-medium truncate">{{ account.name }}</span>
                <span
                  class="text-[13px] tabular-nums shrink-0 font-medium"
                  :class="account.balance >= 0 ? 'text-success' : 'text-destructive'"
                >{{ formatCurrency(account.balance) }}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <!-- Search -->
        <button
          class="p-1 rounded-md transition-all shrink-0 text-muted-foreground/50"
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
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/8 bg-background/95 backdrop-blur-md">
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
            class="absolute left-1/2 -translate-x-1/2 -top-6 size-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 ring-2 ring-background active:scale-95 transition-transform"
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
