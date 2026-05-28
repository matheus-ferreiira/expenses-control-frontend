<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, Pencil, Check, X, Plus, Upload, Flame, MoreHorizontal } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import FinanceSummaryCards from '@/features/finance/components/FinanceSummaryCards.vue'
import FinanceCashflowChart from '@/features/finance/components/FinanceCashflowChart.vue'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog, { type TransactionPrefill } from '@/features/finance/components/TransactionFormDialog.vue'
import TransactionDetailSheet from '@/features/finance/components/TransactionDetailSheet.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useAuthStore } from '@/stores/auth'
import { useTransactionFilters, type QuickFilter } from '@/features/finance/composables/useTransactionFilters'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { utilizationPercent, monthLabel as getMonthLabel } from '@/features/finance/utils/financeHelpers'
import type { Transaction } from '@/types/finance'

const store = useFinanceStore()
const authStore = useAuthStore()
const filterState = useTransactionFilters()
const toast = useToast()

// ── Streak ───────────────────────────────────────────────────────────────────
const streakSheetOpen = ref(false)
const streak = computed(() => authStore.user?.current_streak ?? 0)
const streakActive = computed(() => {
  const last = authStore.user?.last_transaction_date
  if (!last) return false
  const today = new Date()
  const d = new Date(last + 'T00:00:00')
  return d.getFullYear() === today.getFullYear()
    && d.getMonth() === today.getMonth()
    && d.getDate() === today.getDate()
})

// ── OFX import ───────────────────────────────────────────────────────────────
const ofxInputRef = ref<HTMLInputElement | null>(null)

function triggerOfxImport() {
  ofxInputRef.value?.click()
}

function handleOfxFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  toast.success(`Arquivo "${file.name}" selecionado — importação em breve!`)
  // Reset so same file can be selected again
  ;(event.target as HTMLInputElement).value = ''
}

const formOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const transactionPrefill = ref<TransactionPrefill | null>(null)
const deleteOpen = ref(false)
const deletingTransaction = ref<Transaction | null>(null)
const deleting = ref(false)

// Budget editing state
const editingBudgetCatId = ref<string | null>(null)
const editingBudgetValue = ref('')
const savingBudget = ref(false)

function startEditBudget(catId: string, currentLimit: number | null) {
  editingBudgetCatId.value = catId
  editingBudgetValue.value = currentLimit != null ? String(currentLimit) : ''
}

function cancelEditBudget() {
  editingBudgetCatId.value = null
  editingBudgetValue.value = ''
}

async function saveBudget(catId: string) {
  savingBudget.value = true
  try {
    const raw = editingBudgetValue.value.replace(',', '.').trim()
    const limit: number | null = raw === '' ? null : parseFloat(raw)
    await store.updateCategory(catId, { monthly_limit: limit } as Parameters<typeof store.updateCategory>[1])
    toast.success('Meta atualizada')
    editingBudgetCatId.value = null
  } catch {
    toast.error('Erro ao salvar meta')
  } finally {
    savingBudget.value = false
  }
}

// Detail sheet
const detailOpen = ref(false)
const detailTransaction = ref<Transaction | null>(null)

function openDetail(t: Transaction) {
  detailTransaction.value = t
  detailOpen.value = true
}

function onDetailEdit(t: Transaction) {
  openEdit(t)
}

function onDetailDelete(id: string) {
  openDelete(id)
}

async function handleTransactionConfirmed(updated: Transaction) {
  // Update the transaction in-place in the store
  const idx = store.transactions.findIndex((t) => t.id === updated.id)
  if (idx !== -1) store.transactions[idx] = updated
  // Refresh accounts so the updated balance is reflected in sidebar + KPI cards
  await store.fetchAll()
  toast.success('Transação confirmada')
}

const isRecurringDelete = computed(() => !!deletingTransaction.value?.recurrence_group_id)
const deleteDescription = computed(() =>
  isRecurringDelete.value
    ? 'Esta é uma transação fix. Todas as ocorrências (passadas e futuras) serão excluídas permanentemente. Esta ação não pode ser desfeita.'
    : 'Esta ação não pode ser desfeita.',
)

// Monthly income/expenses from loaded transactions
const income = computed(() =>
  store.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
)
const expenses = computed(() =>
  store.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
)

// Credit card used amount derived from current month's transactions
function cardUsed(cardId: string): number {
  return store.transactions
    .filter((t) => t.card_id === cardId && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
}

// Total balance across all active accounts
const totalBalance = computed(() =>
  store.activeAccounts.reduce((s, a) => s + a.balance, 0),
)

// Projected end-of-month balance = current balance + pending income - pending expenses
// Only meaningful for the current month (pending transactions from other months are historical)
const projectedBalance = computed(() => {
  const pendingIncome = store.transactions
    .filter((t) => t.status === 'pending' && t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const pendingExpense = store.transactions
    .filter((t) => t.status === 'pending' && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  return totalBalance.value + pendingIncome - pendingExpense
})

const today = new Date().getDate()

// Top 5 expense categories this month with percentage + budget limit
const topCategories = computed(() => {
  const totalExpenses = store.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const map = new Map<string, { id: string; name: string; color: string; total: number; monthlyLimit: number | null }>()
  store.transactions
    .filter((t) => t.type === 'expense' && t.category)
    .forEach((t) => {
      const cat = t.category!
      const storeCat = store.categories.find((c) => c.id === cat.id)
      const entry = map.get(cat.id)
      if (entry) entry.total += t.amount
      else map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        total: t.amount,
        monthlyLimit: storeCat?.monthly_limit ?? null,
      })
    })

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      percent: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
      budgetPercent: c.monthlyLimit != null && c.monthlyLimit > 0
        ? Math.min(100, Math.round((c.total / c.monthlyLimit) * 100))
        : null,
    }))
})

// Quick shortcuts: top 5 most frequent transactions
const quickShortcuts = computed(() => {
  type ShortcutEntry = {
    description: string
    type: string
    categoryId?: string
    categoryName?: string
    categoryColor?: string
    accountId?: string
    amounts: number[]
    count: number
  }
  const map = new Map<string, ShortcutEntry>()

  store.transactions.forEach((t) => {
    if (t.type === 'transfer') return
    const key = t.description.toLowerCase().trim()
    const entry = map.get(key)
    if (entry) {
      entry.count++
      if (entry.amounts.length < 10) entry.amounts.push(t.amount)
    } else {
      map.set(key, {
        description: t.description,
        type: t.type,
        categoryId: t.category_id ?? undefined,
        categoryName: t.category?.name,
        categoryColor: t.category?.color,
        accountId: t.account_id ?? undefined,
        amounts: [t.amount],
        count: 1,
      })
    }
  })

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s) => {
      const recent = s.amounts.slice(0, 3)
      const avg = recent.reduce((sum, v) => sum + v, 0) / recent.length
      return {
        description: s.description,
        type: s.type,
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        categoryColor: s.categoryColor,
        accountId: s.accountId,
        avgAmount: avg,
      }
    })
})

// Budget usage: expenses as % of income
const budgetPercent = computed(() =>
  income.value > 0 ? Math.min(100, Math.round((expenses.value / income.value) * 100)) : 0,
)

// Month label for mobile summary (long, e.g. "Maio de 2026")
// Uses local-time constructor via getMonthLabel to avoid UTC timezone shift
const monthLabel = computed(() => getMonthLabel(filterState.month.value))

// Short label for KPI cards — "este mês" when current, otherwise "abril de 2026"
const kpiMonthLabel = computed(() => {
  if (filterState.isCurrentMonth()) return 'este mês'
  return getMonthLabel(filterState.month.value).toLowerCase()
})

// Cards with due_day within the next 10 days
const upcomingBills = computed(() =>
  store.activeCards
    .filter((c) => c.due_day >= today && c.due_day - today <= 10)
    .sort((a, b) => a.due_day - b.due_day),
)

// Quick filter pill definitions
const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'income', label: 'Receitas' },
  { id: 'expense', label: 'Despesas' },
  { id: 'fix', label: 'Fixas' },
  { id: 'pending', label: 'Pendentes' },
]

// ── Previous month comparison ─────────────────────────────────────────────
const prevMonthReport = ref<{
  income: number
  expenses: number
  expenses_by_category: Array<{ category: string; color: string; total: number; count: number; percentage: number }>
} | null>(null)

const expenseDelta = computed(() => {
  if (!prevMonthReport.value) return null
  return expenses.value - prevMonthReport.value.expenses
})

const incomeDelta = computed(() => {
  if (!prevMonthReport.value) return null
  return income.value - prevMonthReport.value.income
})

/** Map of category name → previous month total for quick lookup */
const prevCategoryMap = computed<Map<string, number>>(() => {
  const m = new Map<string, number>()
  if (!prevMonthReport.value) return m
  prevMonthReport.value.expenses_by_category.forEach((c) => m.set(c.category, c.total))
  return m
})

async function loadPrevMonthReport() {
  const current = filterState.month.value
  const d = new Date(current + '-01')
  d.setMonth(d.getMonth() - 1)
  const prevYear = d.getFullYear()
  const prevMonth = d.getMonth() + 1
  try {
    const { financeApi } = await import('@/services/api/finance')
    prevMonthReport.value = await financeApi.monthlyReport(prevYear, prevMonth)
  } catch {
    prevMonthReport.value = null
  }
}

// ── First exceeded category (for alert banner) ────────────────────────────
const exceededCategory = computed(() =>
  topCategories.value.find((c) => c.budgetPercent != null && c.budgetPercent >= 100) ?? null
)

async function loadTransactions() {
  await store.fetchTransactions(filterState.toApiFilters())
}

// Reload when month or quick-filter changes
watch(() => filterState.month.value, () => {
  loadTransactions()
  loadPrevMonthReport()
})
watch(() => filterState.quickFilter.value, () => loadTransactions())

function openEdit(t: Transaction) {
  editingTransaction.value = t
  transactionPrefill.value = null
  formOpen.value = true
}

function openWithPrefill(prefill: TransactionPrefill) {
  editingTransaction.value = null
  transactionPrefill.value = prefill
  formOpen.value = true
}

function openDelete(id: string) {
  const t = store.transactions.find((t) => t.id === id) ?? null
  deletingTransaction.value = t
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingTransaction.value) return
  deleting.value = true
  const isRecurring = isRecurringDelete.value
  const groupId = deletingTransaction.value.recurrence_group_id
  const id = deletingTransaction.value.id
  try {
    await store.deleteTransaction(id)
    // If recurring, the backend cascade-deleted all occurrences.
    // Clean them all from local state too so UI is immediately consistent.
    if (isRecurring && groupId) {
      store.removeTransactionGroup(groupId)
    }
    toast.success(isRecurring ? 'Série fix excluída' : 'Transação excluída')
    deleteOpen.value = false
    deletingTransaction.value = null
  } catch {
    toast.error('Erro ao excluir transação')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.fetchAll(), loadTransactions(), loadPrevMonthReport()])
})
</script>

<template>
  <AppPageContainer>

    <!-- Hidden OFX file input -->
    <input
      ref="ofxInputRef"
      type="file"
      accept=".ofx,.csv,.OFX,.CSV"
      class="hidden"
      @change="handleOfxFile"
    />

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 mb-4 pb-3 border-b border-border">
      <div>
        <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/80 mb-0.5">
          Finanças
        </p>
        <h1 class="text-[22px] lg:text-[18px] font-semibold leading-tight tracking-tight text-foreground mt-0.5">
          Visão geral
        </h1>
        <p class="text-[12px] text-muted-foreground mt-1 max-w-prose leading-relaxed">
          Contas, cartões, despesas e receitas em uma única tela funcional.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <!-- StreakChip -->
        <button
          type="button"
          :aria-label="`Streak de ${streak} dias`"
          class="inline-flex items-center gap-1 h-9 px-2.5 rounded-full border border-border bg-card text-[12px] font-semibold tabular-nums hover:bg-muted active:scale-95 transition-all"
          :class="streakActive ? 'text-warning' : 'text-muted-foreground'"
          @click="streakSheetOpen = true"
        >
          <Flame class="size-3.5" :class="streakActive ? '' : 'opacity-50'" />
          {{ streak }}
        </button>

        <!-- Nova transação (hidden on mobile) -->
        <button
          type="button"
          class="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] lg:h-7 lg:px-2 lg:text-[11.5px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          @click="editingTransaction = null; transactionPrefill = null; formOpen = true"
        >
          <Plus class="size-3.5" />
          Transação
        </button>

        <!-- More options dropdown (Importar OFX) -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              aria-label="Mais opções"
              class="min-w-9 h-9 grid place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <MoreHorizontal class="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem class="cursor-pointer" @click="triggerOfxImport">
              <Upload class="size-4 mr-2" /> Importar OFX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Sub-nav -->
    <FinanceSubNav />

    <!-- Summary cards (4 KPI) — always first -->
    <FinanceSummaryCards
      :income="income"
      :expenses="expenses"
      :total-balance="totalBalance"
      :projected-balance="projectedBalance"
      :is-current-month="filterState.isCurrentMonth()"
      :loading="store.loading"
      :month-label="kpiMonthLabel"
      :account-count="store.activeAccounts.length"
      class="mt-4 mb-4"
    />

    <!-- Mobile Month Summary (lg:hidden) — below KPI cards -->
    <div class="lg:hidden bg-card border border-border rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <button
          class="size-8 grid place-items-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
          @click="filterState.prevMonth()"
        >
          <ChevronLeft :size="16" />
        </button>
        <p class="text-sm font-semibold">{{ monthLabel }}</p>
        <button
          class="size-8 grid place-items-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
          @click="filterState.nextMonth()"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Receitas</p>
          <p class="text-sm font-semibold text-success tabular-nums mt-0.5">{{ formatCurrency(income) }}</p>
        </div>
        <div>
          <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Despesas</p>
          <p class="text-sm font-semibold text-destructive tabular-nums mt-0.5">{{ formatCurrency(expenses) }}</p>
        </div>
        <div>
          <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo</p>
          <p class="text-sm font-semibold tabular-nums mt-0.5">{{ formatCurrency(income - expenses) }}</p>
        </div>
      </div>
      <div class="mt-3">
        <div class="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Orçamento do mês</span>
          <span class="tabular-nums">{{ budgetPercent }}%</span>
        </div>
        <div class="h-1.5 bg-muted rounded-full overflow-hidden">
          <div class="h-full bg-foreground rounded-full transition-all" :style="{ width: `${budgetPercent}%` }" />
        </div>
      </div>
    </div>

    <!-- Alert banner — category budget exceeded -->
    <div
      v-if="exceededCategory && !store.loading"
      class="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-4 bg-destructive/10 border border-destructive/20"
    >
      <span class="text-destructive shrink-0">⚠</span>
      <p class="text-[12px] text-destructive/90 font-medium leading-snug">
        <span class="font-semibold">{{ exceededCategory.name }}</span>
        ultrapassou a meta em {{ formatCurrency(exceededCategory.total - (exceededCategory.monthlyLimit ?? 0)) }}
      </p>
    </div>

    <!-- Month comparison line -->
    <div
      v-if="expenseDelta !== null && !store.loading"
      class="flex items-center gap-1.5 mb-4 text-[12px]"
    >
      <span class="text-muted-foreground/50">vs mês anterior:</span>
      <span
        class="flex items-center gap-0.5 font-medium tabular-nums"
        :class="expenseDelta <= 0 ? 'text-success' : 'text-destructive'"
      >
        {{ expenseDelta <= 0 ? '↘' : '↗' }}
        {{ expenseDelta <= 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(expenseDelta)) }} em despesas
      </span>
    </div>

    <!-- 2-column layout: main (2/3) + sidebar (1/3) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Main column -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Cashflow chart — anchored to the selected month -->
        <div class="hidden lg:block">
          <FinanceCashflowChart :month="filterState.month.value" />
        </div>

        <!-- Month navigator + transactions -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              Transações
            </h2>
            <MonthNavigator
              :month="filterState.month.value"
              :is-current-month="filterState.isCurrentMonth()"
              @prev="filterState.prevMonth()"
              @next="filterState.nextMonth()"
              @reset="filterState.resetToCurrentMonth()"
            />
          </div>
          <!-- Quick shortcuts — top 5 frequent transactions -->
          <div v-if="quickShortcuts.length > 0" class="mb-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                Atalhos
              </p>
              <span class="text-[10px] text-muted-foreground/35">Toque para registrar</span>
            </div>
            <div class="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              <button
                v-for="shortcut in quickShortcuts"
                :key="shortcut.description"
                type="button"
                class="flex flex-col items-start gap-1 shrink-0 rounded-xl border border-border/50 bg-card px-3 py-2.5 hover:bg-accent/20 active:bg-accent/30 transition-colors text-left min-w-[96px] max-w-[120px]"
                @click="openWithPrefill({
                  type: shortcut.type as 'expense' | 'income',
                  description: shortcut.description,
                  category_id: shortcut.categoryId,
                  account_id: shortcut.accountId,
                  amount: shortcut.avgAmount.toFixed(2).replace('.', ','),
                })"
              >
                <span
                  class="flex items-center justify-center size-7 rounded-lg text-xs font-bold text-white shrink-0"
                  :style="{ background: shortcut.categoryColor || 'hsl(var(--muted-foreground) / 0.3)' }"
                >
                  {{ shortcut.description.charAt(0).toUpperCase() }}
                </span>
                <p class="text-[12px] font-medium text-foreground truncate w-full">{{ shortcut.description }}</p>
                <p class="text-[10px] text-muted-foreground/50 tabular-nums">
                  R$&nbsp;{{ shortcut.avgAmount.toFixed(0) }}
                </p>
              </button>
            </div>
          </div>

          <!-- Quick filter pills: Todas | Receitas | Despesas | Fixas | Pendentes -->
          <div class="-mx-0 flex items-center gap-1 mb-3 overflow-x-auto scrollbar-none">
            <button
              v-for="f in QUICK_FILTERS"
              :key="f.id"
              type="button"
              class="h-7 px-3 rounded-full text-[11px] font-medium whitespace-nowrap border transition-all shrink-0"
              :class="filterState.quickFilter.value === f.id
                ? 'bg-foreground text-background border-foreground'
                : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent'"
              @click="filterState.setQuickFilter(f.id)"
            >
              {{ f.label }}
            </button>
          </div>

          <TransactionList
            :transactions="store.transactions"
            :loading="store.loading"
            :total-balance="totalBalance"
            @select="openDetail"
            @confirmed="handleTransactionConfirmed"
          />
        </div>

      </div>

      <!-- Sidebar column -->
      <div class="lg:col-span-1 space-y-4">

        <!-- Contas -->
        <div class="bg-card border border-border rounded-md overflow-hidden">
          <header class="flex items-center justify-between px-3.5 h-9 border-b border-border">
            <h2 class="text-[12px] font-semibold tracking-tight text-foreground">Contas</h2>
            <RouterLink
              :to="{ name: 'finance-accounts' }"
              class="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todas
            </RouterLink>
          </header>
          <div v-if="store.loading" class="divide-y divide-border">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3 px-4 py-3">
              <div class="size-9 rounded-md bg-muted/60 animate-pulse shrink-0" />
              <div class="flex-1 space-y-1.5">
                <div class="h-3 w-24 rounded bg-muted/60 animate-pulse" />
                <div class="h-2.5 w-16 rounded bg-muted/60 animate-pulse" />
              </div>
              <div class="h-4 w-20 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div v-else-if="store.activeAccounts.length === 0" class="px-4 py-4 text-[12px] text-muted-foreground/60">
            Nenhuma conta cadastrada
          </div>
          <ul v-else class="divide-y divide-border">
            <li
              v-for="account in store.activeAccounts.slice(0, 4)"
              :key="account.id"
              class="relative flex items-center gap-3 px-4 py-3 pt-3.5"
            >
              <!-- Brand color stripe at top -->
              <span
                class="absolute top-0 left-0 right-0 h-[2px]"
                :style="{ background: account.color || 'hsl(var(--muted-foreground) / 0.3)' }"
              />
              <!-- Solid brand avatar -->
              <span
                class="size-9 rounded-md grid place-items-center font-bold text-[13px] shrink-0"
                :style="{
                  background: account.color || 'hsl(var(--muted-foreground) / 0.4)',
                  color: 'hsl(var(--background))',
                }"
              >
                {{ account.name.slice(0, 2).toUpperCase() }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate">{{ account.name }}</p>
                <p class="text-[11px] text-muted-foreground">{{ account.bank_name || account.type }}</p>
              </div>
              <span class="text-[20px] font-medium tabular-nums shrink-0">
                {{ formatCurrency(account.balance) }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Cartões -->
        <div class="bg-card border border-border rounded-md overflow-hidden">
          <header class="flex items-center justify-between px-3.5 h-9 border-b border-border">
            <h2 class="text-[12px] font-semibold tracking-tight text-foreground">Cartões</h2>
            <RouterLink
              :to="{ name: 'finance-cards' }"
              class="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todos
            </RouterLink>
          </header>
          <div v-if="store.loading" class="divide-y divide-border">
            <div v-for="i in 2" :key="i" class="px-4 py-3 space-y-2">
              <div class="flex items-center gap-2">
                <div class="size-8 rounded-md bg-muted/60 animate-pulse shrink-0" />
                <div class="flex-1 space-y-1.5">
                  <div class="h-3 w-24 rounded bg-muted/60 animate-pulse" />
                  <div class="h-2.5 w-20 rounded bg-muted/60 animate-pulse" />
                </div>
              </div>
              <div class="h-1 w-full rounded-full bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div v-else-if="store.activeCards.length === 0" class="px-4 py-4 text-[12px] text-muted-foreground/60">
            Nenhum cartão cadastrado
          </div>
          <ul v-else class="divide-y divide-border">
            <li
              v-for="card in store.activeCards.slice(0, 3)"
              :key="card.id"
              class="px-4 py-3 hover:bg-muted/30 transition-colors"
              :style="{ boxShadow: `inset 3px 0 0 0 ${card.color || 'hsl(var(--muted-foreground) / 0.3)'}` }"
            >
              <div class="flex items-start gap-3 text-sm">
                <!-- Solid color avatar -->
                <span
                  class="size-8 rounded-md grid place-items-center font-bold text-[11px] shrink-0"
                  :style="{
                    background: card.color || 'hsl(var(--muted-foreground) / 0.4)',
                    color: 'hsl(var(--background))',
                  }"
                >
                  {{ card.name.slice(0, 2).toUpperCase() }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ card.name }}</p>
                  <p class="text-[11px] text-muted-foreground">vence dia {{ card.due_day }}</p>
                  <!-- Fatura atual -->
                  <div class="mt-1.5 flex items-baseline gap-1.5">
                    <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Fatura:</span>
                    <span class="text-[14px] font-medium tabular-nums">{{ formatCurrency(cardUsed(card.id)) }}</span>
                  </div>
                  <!-- DueBadge -->
                  <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      class="inline-flex items-center h-6 px-2 rounded-md text-[11px] font-semibold border"
                      :class="
                        (card.due_day - today) < 3
                          ? 'bg-destructive/20 text-destructive border-destructive/40 font-bold'
                          : (card.due_day - today) <= 10
                            ? 'bg-warning/15 text-warning border-warning/30'
                            : 'bg-success/15 text-success border-success/30'
                      "
                    >
                      {{ card.due_day - today === 0 ? 'Vence hoje' : card.due_day - today === 1 ? 'Vence amanhã' : `Vence em ${card.due_day - today} dias` }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Utilization bar -->
              <div class="h-1 bg-muted rounded-full overflow-hidden mt-2.5">
                <div
                  class="h-full transition-all duration-500"
                  :class="
                    utilizationPercent(cardUsed(card.id), card.limit_amount) >= 76 ? 'bg-destructive' :
                    utilizationPercent(cardUsed(card.id), card.limit_amount) >= 51 ? 'bg-warning' : 'bg-success'
                  "
                  :style="{ width: utilizationPercent(cardUsed(card.id), card.limit_amount) + '%' }"
                />
              </div>
              <div class="flex justify-between text-[10.5px] text-muted-foreground/80 mt-1 tabular-nums">
                <span>{{ formatCurrency(cardUsed(card.id)) }} / {{ formatCurrency(card.limit_amount) }}</span>
                <span>{{ utilizationPercent(cardUsed(card.id), card.limit_amount) }}%</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Categorias do mês -->
        <div class="bg-card border border-border rounded-md overflow-hidden">
          <header class="flex items-center justify-between px-3.5 h-9 border-b border-border">
            <h2 class="text-[12px] font-semibold tracking-tight text-foreground">Categorias do mês</h2>
          </header>
          <div v-if="store.loading" class="divide-y divide-border">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-3">
              <div class="size-7 rounded-md bg-muted/60 animate-pulse shrink-0" />
              <div class="flex-1 space-y-1.5">
                <div class="h-3 w-24 rounded bg-muted/60 animate-pulse" />
                <div class="h-1.5 w-full rounded-full bg-muted/60 animate-pulse mt-2" />
              </div>
            </div>
          </div>
          <div v-else-if="topCategories.length === 0" class="px-4 py-4 text-[12px] text-muted-foreground/60">
            Sem despesas este mês
          </div>
          <ul v-else class="divide-y divide-border">
            <li v-for="cat in topCategories" :key="cat.name">
              <button
                type="button"
                class="w-full text-left px-4 py-3 min-h-[52px] transition-colors hover:bg-muted/30"
                @click="startEditBudget(cat.id, cat.monthlyLimit)"
              >
                <div class="flex items-center gap-3">
                  <!-- Color swatch -->
                  <span
                    class="size-7 rounded-md grid place-items-center shrink-0 text-[11px] font-bold"
                    :style="{ background: cat.color + '22', color: cat.color }"
                  >
                    {{ cat.name.charAt(0).toUpperCase() }}
                  </span>
                  <span class="flex-1 text-sm">{{ cat.name }}</span>
                  <div class="text-right">
                    <span class="block text-sm tabular-nums font-medium">{{ formatCurrency(cat.total) }}</span>
                    <span v-if="cat.monthlyLimit" class="block text-[10.5px] text-muted-foreground tabular-nums">
                      de {{ formatCurrency(cat.monthlyLimit) }}
                    </span>
                  </div>
                </div>
                <!-- Budget progress bar -->
                <div class="mt-1.5 ml-10 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{
                      width: (cat.budgetPercent != null ? cat.budgetPercent : cat.percent) + '%',
                      background: (cat.budgetPercent != null && cat.budgetPercent >= 100) ? 'var(--destructive)'
                        : (cat.budgetPercent != null && cat.budgetPercent >= 70) ? 'var(--warning)'
                        : cat.color,
                    }"
                  />
                </div>
                <div class="mt-1 ml-10 flex items-center justify-between text-[11px]">
                  <span
                    v-if="cat.budgetPercent != null && cat.budgetPercent >= 100"
                    class="inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-bold border bg-destructive/15 text-destructive border-destructive/30"
                  >
                    Meta estourada
                  </span>
                  <span v-else class="text-muted-foreground tabular-nums">
                    {{ cat.budgetPercent != null ? cat.budgetPercent + '% da meta' : cat.percent + '% do total' }}
                  </span>
                  <!-- Delta vs mês anterior -->
                  <span
                    v-if="prevCategoryMap.has(cat.name)"
                    class="inline-flex items-center gap-0.5 font-semibold tabular-nums"
                    :class="(cat.total - (prevCategoryMap.get(cat.name) ?? 0)) > 0 ? 'text-destructive' : (cat.total - (prevCategoryMap.get(cat.name) ?? 0)) < 0 ? 'text-success' : 'text-muted-foreground'"
                  >
                    {{ (cat.total - (prevCategoryMap.get(cat.name) ?? 0)) > 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(cat.total - (prevCategoryMap.get(cat.name) ?? 0))) }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </div>

        <!-- Budget edit sheet (replaces inline editor) -->
        <Sheet :open="editingBudgetCatId !== null" @update:open="(v) => { if (!v) cancelEditBudget() }">
          <SheetContent side="bottom" class="rounded-t-2xl p-5 max-w-xl mx-auto">
            <div class="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <SheetHeader class="text-left mb-4">
              <SheetTitle class="text-base">Meta de {{ topCategories.find(c => c.id === editingBudgetCatId)?.name }}</SheetTitle>
              <SheetDescription class="text-xs">Defina o limite mensal para esta categoria.</SheetDescription>
            </SheetHeader>
            <label class="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Meta mensal</label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">R$</span>
              <input
                v-model="editingBudgetValue"
                type="number"
                min="0"
                step="10"
                placeholder="0"
                class="flex-1 h-10 text-lg font-semibold tabular-nums bg-background border border-input rounded-md px-3 text-foreground"
                @keyup.enter="editingBudgetCatId && saveBudget(editingBudgetCatId)"
              />
            </div>
            <div class="flex gap-2 mt-5">
              <button
                type="button"
                class="flex-1 h-9 px-3 text-[13px] lg:h-7 lg:px-2 lg:text-[11.5px] font-medium inline-flex items-center justify-center rounded-md border border-border bg-transparent hover:bg-muted/60 text-foreground transition-colors"
                @click="cancelEditBudget"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="flex-1 h-9 px-3 text-[13px] lg:h-7 lg:px-2 lg:text-[11.5px] font-medium inline-flex items-center justify-center rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
                :disabled="savingBudget"
                @click="editingBudgetCatId && saveBudget(editingBudgetCatId)"
              >
                Salvar meta
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <!-- Upcoming bills — within 10 days -->
        <div v-if="!store.loading && upcomingBills.length > 0" class="bg-card border border-border rounded-md overflow-hidden">
          <header class="flex items-center px-3.5 h-9 border-b border-border">
            <h2 class="text-[12px] font-semibold tracking-tight text-foreground">Próximos vencimentos</h2>
          </header>
          <div class="divide-y divide-border">
            <div
              v-for="card in upcomingBills"
              :key="card.id"
              class="flex items-center justify-between px-4 py-3"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="h-2 w-2 rounded-full shrink-0" :style="{ background: card.color || 'hsl(var(--muted-foreground))' }" />
                <span class="text-[12px] text-foreground/80 truncate">{{ card.name }}</span>
              </div>
              <span
                class="text-[11px] shrink-0 ml-2 font-medium"
                :class="
                  card.due_day - today === 0 ? 'text-destructive/80' :
                  card.due_day - today <= 3 ? 'text-warning/80' :
                  'text-muted-foreground/50'
                "
              >
                {{ card.due_day - today === 0 ? 'vence hoje' : `dia ${card.due_day}` }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </AppPageContainer>

  <!-- Dialogs -->
  <TransactionFormDialog
    v-model:open="formOpen"
    :transaction="editingTransaction"
    :prefill="transactionPrefill"
    @created="loadTransactions"
    @updated="loadTransactions"
  />

  <ConfirmDialog
    v-model:open="deleteOpen"
    :title="isRecurringDelete ? 'Excluir série fix' : 'Excluir transação'"
    :description="deleteDescription"
    :confirm-label="isRecurringDelete ? 'Excluir todas' : 'Excluir'"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />

  <!-- Transaction detail bottom sheet -->
  <TransactionDetailSheet
    v-model:open="detailOpen"
    :transaction="detailTransaction"
    @edit="onDetailEdit"
    @delete="onDetailDelete"
  />

  <!-- Streak info sheet -->
  <Sheet v-model:open="streakSheetOpen">
    <SheetContent side="bottom" class="rounded-t-2xl p-5 max-w-xl mx-auto">
      <div class="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
      <SheetHeader class="text-left">
        <SheetTitle class="text-base flex items-center gap-2">
          <Flame class="size-4 text-warning" />
          {{ streak }} dias seguidos
        </SheetTitle>
        <SheetDescription class="text-xs">
          {{ streakActive
            ? 'Você está registrando há vários dias seguidos. Continue assim!'
            : 'Você ainda não registrou nada hoje. Registre uma transação para manter sua sequência.' }}
        </SheetDescription>
      </SheetHeader>
      <button
        v-if="!streakActive"
        type="button"
        class="w-full mt-4 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-md text-[14.5px] lg:h-8 lg:px-2.5 lg:text-[12.5px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
        @click="streakSheetOpen = false; editingTransaction = null; transactionPrefill = null; formOpen = true"
      >
        <Plus class="size-4" /> Registrar agora
      </button>
    </SheetContent>
  </Sheet>
</template>
