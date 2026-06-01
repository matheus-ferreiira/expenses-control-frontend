<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Plus, Search, X, ChevronDown } from 'lucide-vue-next'
import { financeApi } from '@/services/api/finance'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { AppPageContainer } from '@/components/shared'
import TransactionSummaryCard from '@/features/finance/components/TransactionSummaryCard.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import TransactionDetailSheet from '@/features/finance/components/TransactionDetailSheet.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useTransactionFilters } from '@/features/finance/composables/useTransactionFilters'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { currentMonth } from '@/features/finance/utils/financeHelpers'
import type { Transaction } from '@/types/finance'

const store = useFinanceStore()
const filterState = useTransactionFilters()
const toast = useToast()

// ── Dialogs ───────────────────────────────────────────────────────────────────
const formOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)

// ── Detail sheet ──────────────────────────────────────────────────────────────
const detailOpen = ref(false)
const detailTransaction = ref<Transaction | null>(null)

function openDetail(t: Transaction) {
  detailTransaction.value = t
  detailOpen.value = true
}

// ── Inline search ─────────────────────────────────────────────────────────────
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (!searchOpen.value) {
    searchQuery.value = ''
  } else {
    await nextTick()
    searchInputRef.value?.focus()
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}

// ── Filter chips — local UI state ─────────────────────────────────────────────
type ChipId = 'all' | 'income' | 'expense' | 'transfer' | 'fix' | 'pending'

const activeChip = ref<ChipId>('all')

const CHIPS: { id: ChipId; label: string }[] = [
  { id: 'all',      label: 'Todas' },
  { id: 'income',   label: 'Receitas' },
  { id: 'expense',  label: 'Despesas' },
  { id: 'transfer', label: 'Transferências' },
  { id: 'fix',      label: 'Fixas' },
  { id: 'pending',  label: 'Pendentes' },
]

// Day filter — client-side, within the loaded month
const selectedDay = ref<string | null>(null)

const hasAnyFilter = computed(() =>
  activeChip.value !== 'all' ||
  !!filterState.account_id.value ||
  !!filterState.category_id.value ||
  !!selectedDay.value,
)

function setChip(chip: ChipId) {
  activeChip.value = chip
  selectedDay.value = null
  if (chip === 'transfer') {
    filterState.setType('transfer')
    filterState.setQuickFilter('all')
  } else {
    filterState.setType(undefined)
    filterState.setQuickFilter(chip)
  }
  loadTransactions()
}

function setAccount(id: string | undefined) {
  filterState.setAccountId(id)
  loadTransactions()
}

function setCategory(id: string | undefined) {
  filterState.setCategoryId(id)
  loadTransactions()
}

function selectDay(day: string | null) {
  selectedDay.value = selectedDay.value === day ? null : day
}

function clearFilters() {
  activeChip.value = 'all'
  selectedDay.value = null
  filterState.reset()
  loadTransactions()
}

function formatDayLabel(dateStr: string): string {
  const day = parseInt(dateStr.split('-')[2] ?? '0')
  return `Dia ${day}`
}

// ── Filter-derived computed ───────────────────────────────────────────────────
const selectedAccountName = computed(() =>
  filterState.account_id.value
    ? store.activeAccounts.find(a => a.id === filterState.account_id.value)?.name ?? null
    : null,
)

const selectedCategoryName = computed(() =>
  filterState.category_id.value
    ? store.categories.find(c => c.id === filterState.category_id.value)?.name ?? null
    : null,
)

const filterableCategories = computed(() => {
  if (activeChip.value === 'income') return store.categories.filter(c => c.type === 'income')
  if (activeChip.value === 'expense') return store.categories.filter(c => c.type === 'expense')
  return store.categories
})

/** All days of the navigated month, annotated with whether any loaded transaction falls on that day. */
const monthDays = computed(() => {
  const parts = filterState.month.value.split('-').map(Number)
  const year = parts[0]!
  const mon = parts[1]!
  const daysInMonth = new Date(year, mon, 0).getDate()
  const txDates = new Set(store.transactions.map(t => t.transaction_date))
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return { day, dateStr, hasTx: txDates.has(dateStr) }
  })
})

// ── Filtered transactions (day + search layered on API-filtered results) ───────
const filteredTransactions = computed(() => {
  let txs = store.transactions
  if (selectedDay.value) {
    txs = txs.filter(t => t.transaction_date === selectedDay.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return txs
  return txs.filter(
    t =>
      t.description.toLowerCase().includes(q) ||
      t.category?.name.toLowerCase().includes(q) ||
      t.account?.name.toLowerCase().includes(q) ||
      t.card?.name.toLowerCase().includes(q),
  )
})

// ── Summary card enrichment ───────────────────────────────────────────────────
const transactionCount = computed(() => store.transactions.length)

const biggestExpense = computed(() => {
  const expenses = store.transactions.filter(t => t.type === 'expense')
  if (!expenses.length) return null
  return expenses.reduce((max, t) => (t.amount > max.amount ? t : max))
})

// ── Load + watchers ───────────────────────────────────────────────────────────
async function loadTransactions() {
  await store.fetchTransactions(filterState.toApiFilters())
}

watch(
  () => filterState.month.value,
  () => {
    selectedDay.value = null
    loadTransactions()
    loadPrevMonthReport()
  },
)

// ── CRUD ──────────────────────────────────────────────────────────────────────
function openCreate() {
  editingTransaction.value = null
  formOpen.value = true
}

function openEdit(t: Transaction) {
  detailOpen.value = false
  editingTransaction.value = t
  formOpen.value = true
}

function openDelete(id: string) {
  detailOpen.value = false
  deletingId.value = id
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingId.value) return
  deleting.value = true
  try {
    await store.deleteTransaction(deletingId.value)
    toast.success('Transação excluída')
    deleteOpen.value = false
    deletingId.value = null
  } catch {
    toast.error('Erro ao excluir transação')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.fetchAll(), loadTransactions(), loadPrevMonthReport()])
})

// ── Month context (for empty state copy) ─────────────────────────────────────
const monthContext = computed<'current' | 'past' | 'future'>(() => {
  const now = currentMonth()
  if (filterState.month.value === now) return 'current'
  return filterState.month.value > now ? 'future' : 'past'
})

// ── Summary card data ─────────────────────────────────────────────────────────
const totalBalance = computed(() =>
  store.activeAccounts.reduce((s, a) => s + a.balance, 0),
)
const monthIncome = computed(() =>
  store.transactions
    .filter(t => t.type === 'income' && t.status === 'confirmed')
    .reduce((s, t) => s + t.amount, 0),
)
const monthExpenses = computed(() =>
  store.transactions
    .filter(t => t.type === 'expense' && t.status === 'confirmed')
    .reduce((s, t) => s + t.amount, 0),
)
const pendingIncome = computed(() =>
  store.transactions
    .filter(t => t.status === 'pending' && t.type === 'income')
    .reduce((s, t) => s + t.amount, 0),
)
const pendingExpenses = computed(() =>
  store.transactions
    .filter(t => t.status === 'pending' && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0),
)

// ── Previous month comparison ─────────────────────────────────────────────────
const prevMonthReport = ref<{ income: number; expenses: number } | null>(null)
const expenseDelta = computed(() => {
  if (!prevMonthReport.value) return null
  return monthExpenses.value - prevMonthReport.value.expenses
})

async function loadPrevMonthReport() {
  const current = filterState.month.value
  const d = new Date(current + '-01')
  d.setMonth(d.getMonth() - 1)
  try {
    prevMonthReport.value = await financeApi.monthlyReport(d.getFullYear(), d.getMonth() + 1)
  } catch {
    prevMonthReport.value = null
  }
}
</script>

<template>
  <AppPageContainer>

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between mb-5 pb-3 border-b border-border">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-0.5">
          Finanças
        </p>
        <h1 class="text-[22px] font-bold tracking-tight text-foreground leading-none mb-1">
          Transações
        </h1>
        <p class="text-[13px] text-muted-foreground/60">
          Histórico completo de receitas e despesas.
        </p>
      </div>
      <div class="flex items-center gap-2 mt-1 shrink-0">
        <!-- Search toggle -->
        <button
          type="button"
          class="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          :class="searchOpen ? 'bg-muted text-foreground' : ''"
          @click="toggleSearch"
        >
          <Search :size="15" />
        </button>
        <!-- + Transação — desktop only, FAB covers mobile -->
        <button
          type="button"
          class="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          @click="openCreate"
        >
          <Plus :size="14" />
          Transação
        </button>
      </div>
    </div>

    <!-- ── Inline search ───────────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="searchOpen" class="mb-4">
        <div class="relative">
          <Search
            :size="14"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
          />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome, categoria, valor..."
            class="w-full h-10 pl-9 pr-9 rounded-lg border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
            @click="clearSearch"
          >
            <X :size="13" />
          </button>
        </div>
        <p v-if="searchQuery" class="mt-1.5 text-[11px] text-muted-foreground/50">
          {{ filteredTransactions.length }} resultado{{ filteredTransactions.length !== 1 ? 's' : '' }}
          para "{{ searchQuery }}"
        </p>
      </div>
    </Transition>

    <!-- ── Extended summary card ────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-lg mb-4">
      <!-- TransactionSummaryCard: neutralise its own border+radius so the outer div controls them -->
      <TransactionSummaryCard
        :month="filterState.month.value"
        :income="monthIncome"
        :expenses="monthExpenses"
        :total-balance="totalBalance"
        :pending-income="pendingIncome"
        :pending-expenses="pendingExpenses"
        :expense-delta="expenseDelta"
        class="!border-0 !rounded-none !shadow-none"
        @prev="filterState.prevMonth()"
        @next="filterState.nextMonth()"
        @reset="filterState.resetToCurrentMonth()"
        @select-month="filterState.month.value = $event"
      />

      <!-- Enrichment row: transaction count + biggest expense + pending -->
      <div
        v-if="!store.loading"
        class="border-t border-border/40 px-4 pb-3 pt-2.5 grid gap-3"
        :class="(pendingIncome > 0 || pendingExpenses > 0) ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <div>
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">
            Transações
          </p>
          <p class="text-[14px] font-semibold tabular-nums text-foreground">
            {{ transactionCount }} no mês
          </p>
        </div>
        <div v-if="biggestExpense">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">
            Maior despesa
          </p>
          <p class="text-[14px] font-semibold tabular-nums text-destructive">
            {{ formatCurrency(biggestExpense.amount) }}
          </p>
          <p class="text-[11px] text-muted-foreground/50 truncate leading-tight mt-0.5">
            {{ biggestExpense.category?.name ?? biggestExpense.description }}
          </p>
        </div>
        <!-- Pending amounts (M2) -->
        <div v-if="pendingIncome > 0 || pendingExpenses > 0">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">
            Pendentes
          </p>
          <p class="text-[13px] tabular-nums font-medium leading-snug">
            <span v-if="pendingIncome > 0" class="text-success/70">+{{ formatCurrency(pendingIncome) }}</span>
            <span v-if="pendingIncome > 0 && pendingExpenses > 0" class="text-muted-foreground/30 mx-0.5">·</span>
            <span v-if="pendingExpenses > 0" class="text-destructive/70">-{{ formatCurrency(pendingExpenses) }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- ── Filter chips ─────────────────────────────────────────────────── -->
    <div class="flex items-center gap-2 mb-4">

      <!-- Scrollable chips area -->
      <div class="flex-1 overflow-x-auto scrollbar-none min-w-0">
        <div class="flex gap-2 py-0.5 w-max">

          <!-- Type chips -->
          <button
            v-for="chip in CHIPS"
            :key="chip.id"
            type="button"
            class="h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 shrink-0 whitespace-nowrap"
            :class="activeChip === chip.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
            @click="setChip(chip.id)"
          >
            {{ chip.label }}
          </button>

          <!-- Divider -->
          <div class="w-px h-5 bg-border/60 shrink-0 self-center" />

          <!-- Account chip -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                :class="selectedAccountName
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
              >
                <span class="max-w-[100px] truncate">{{ selectedAccountName ?? 'Conta' }}</span>
                <ChevronDown :size="10" class="opacity-60 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-48">
              <DropdownMenuItem @click="setAccount(undefined)">
                <span :class="!filterState.account_id.value ? 'text-primary font-medium' : ''">
                  Todas as contas
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator v-if="store.activeAccounts.length" />
              <DropdownMenuItem
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                @click="setAccount(acc.id)"
              >
                <span :class="filterState.account_id.value === acc.id ? 'text-primary font-medium' : ''">
                  {{ acc.name }}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Category chip -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                :class="selectedCategoryName
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
              >
                <span class="max-w-[100px] truncate">{{ selectedCategoryName ?? 'Categoria' }}</span>
                <ChevronDown :size="10" class="opacity-60 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-48 max-h-64 overflow-y-auto">
              <DropdownMenuItem @click="setCategory(undefined)">
                <span :class="!filterState.category_id.value ? 'text-primary font-medium' : ''">
                  Todas as categorias
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator v-if="filterableCategories.length" />
              <DropdownMenuItem
                v-for="cat in filterableCategories"
                :key="cat.id"
                @click="setCategory(cat.id)"
              >
                <span :class="filterState.category_id.value === cat.id ? 'text-primary font-medium' : ''">
                  {{ cat.name }}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Day picker chip -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                :class="selectedDay
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
              >
                {{ selectedDay ? formatDayLabel(selectedDay) : 'Data' }}
                <ChevronDown :size="10" class="opacity-60 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-56 p-2">
              <button
                type="button"
                class="w-full text-left text-[12px] px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
                :class="!selectedDay ? 'text-primary font-medium' : 'text-muted-foreground'"
                @click="selectDay(null)"
              >
                Todos os dias
              </button>
              <div class="mt-1.5 border-t border-border/40 pt-2">
                <!-- Days header -->
                <div class="grid grid-cols-7 gap-0.5 mb-1">
                  <span
                    v-for="d in ['D','S','T','Q','Q','S','S']"
                    :key="d"
                    class="h-6 flex items-center justify-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40"
                  >{{ d }}</span>
                </div>
                <!-- Day grid -->
                <div class="grid grid-cols-7 gap-0.5">
                  <button
                    v-for="{ day, dateStr, hasTx } in monthDays"
                    :key="dateStr"
                    type="button"
                    class="h-7 w-full rounded-md text-[11px] flex items-center justify-center transition-colors"
                    :class="[
                      selectedDay === dateStr
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : hasTx
                          ? 'text-foreground font-medium hover:bg-muted/50 cursor-pointer'
                          : 'text-muted-foreground/25 cursor-default',
                    ]"
                    @click="hasTx ? selectDay(dateStr) : undefined"
                  >
                    {{ day }}
                  </button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      <!-- Clear filters — fixed right, outside scroll -->
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <button
          v-if="hasAnyFilter"
          type="button"
          class="shrink-0 h-7 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
          @click="clearFilters"
        >
          <X :size="10" />
          Limpar
        </button>
      </Transition>
    </div>

    <!-- ── Transaction list ──────────────────────────────────────────────── -->
    <TransactionList
      :transactions="filteredTransactions"
      :loading="store.loading"
      :nested="true"
      :has-filter="hasAnyFilter || !!searchQuery"
      :month-context="monthContext"
      @select="openDetail"
      @add-new="openCreate"
    />

  </AppPageContainer>

  <!-- ── Dialogs ──────────────────────────────────────────────────────── -->
  <TransactionDetailSheet
    v-model:open="detailOpen"
    :transaction="detailTransaction"
    @edit="openEdit"
    @delete="openDelete"
  />

  <TransactionFormDialog
    v-model:open="formOpen"
    :transaction="editingTransaction"
    @created="loadTransactions"
    @updated="loadTransactions"
  />

  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir transação"
    description="Esta ação não pode ser desfeita."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
