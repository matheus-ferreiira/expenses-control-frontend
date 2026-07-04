<script setup lang="ts">
import { computed, nextTick, watch, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, ChevronDown, X, Plus, Upload, Flame, MoreHorizontal, Search, Calendar, AlertTriangle, Tag } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AppPageContainer, PageHeader } from '@/components/shared'
import MonthSummaryCard from '@/features/finance/components/MonthSummaryCard.vue'
import PendingThisWeekCard from '@/features/finance/components/PendingThisWeekCard.vue'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog, { type TransactionPrefill } from '@/features/finance/components/TransactionFormDialog.vue'
import TransactionDetailSheet from '@/features/finance/components/TransactionDetailSheet.vue'
import BalanceDetailSheet from '@/features/finance/components/BalanceDetailSheet.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useAuthStore } from '@/stores/auth'
import { financeApi } from '@/services/api/finance'
import { useTransactionFilters, type QuickFilter } from '@/features/finance/composables/useTransactionFilters'
import { useHistoricalBalance } from '@/features/finance/composables/useHistoricalBalance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { currentMonth } from '@/features/finance/utils/financeHelpers'
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

// Highlight newly created transaction
const newlyCreatedId = ref<string | null>(null)

async function onTransactionCreated(t: Transaction) {
  await Promise.all([loadTransactions(), loadCurrentMonthSummary()])
  newlyCreatedId.value = t.id
  // Scroll to the new transaction and clear highlight after 2.5s
  await nextTick()
  const el = document.getElementById(`tx-${t.id}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  setTimeout(() => { newlyCreatedId.value = null }, 2500)
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

function onDetailDuplicate(t: Transaction) {
  editingTransaction.value = null
  transactionPrefill.value = {
    type: t.type,
    description: t.description,
    amount: t.amount.toString(),
    category_id: t.category_id ?? undefined,
    account_id: t.account_id ?? undefined,
  }
  // Duplicate with today as date and without recurrence/installments
  // (fromTransaction in the form clears is_recurring and total_installments)
  formOpen.value = true
}

async function handleTransactionConfirmed(updated: Transaction) {
  const idx = store.transactions.findIndex((t) => t.id === updated.id)
  if (idx !== -1) store.transactions[idx] = updated
  await Promise.all([store.fetchAll(), loadCurrentMonthSummary()])
  toast.success('Transação confirmada')
}

async function handleQuickConfirm(t: Transaction) {
  try {
    const updated = await financeApi.transactions.confirm(t.id)
    handleTransactionConfirmed(updated)
  } catch {
    toast.error('Erro ao confirmar transação')
  }
}

/** Card "Pendentes da semana" confirmou algo — recarrega saldos, resumo e lista */
async function onWeeklyPendingConfirmed() {
  await Promise.all([store.fetchAll(), loadTransactions(), loadCurrentMonthSummary()])
}

const isRecurringDelete = computed(() => !!deletingTransaction.value?.recurrence_group_id)
const deleteDescription = computed(() =>
  isRecurringDelete.value
    ? 'Esta é uma transação fix. Todas as ocorrências (passadas e futuras) serão excluídas permanentemente. Esta ação não pode ser desfeita.'
    : 'Esta ação não pode ser desfeita.',
)

// Current month authoritative totals from backend — not affected by pagination.
// Falls back to 0 while loading or on error.
type MonthlySummary = Awaited<ReturnType<typeof financeApi.monthlyReport>>
const currentMonthSummary = ref<MonthlySummary | null>(null)

async function loadCurrentMonthSummary() {
  const [year, month] = filterState.month.value.split('-').map(Number)
  try {
    currentMonthSummary.value = await financeApi.monthlyReport(year!, month!)
  } catch {
    currentMonthSummary.value = null
  }
}

const income = computed(() => currentMonthSummary.value?.income ?? 0)
const expenses = computed(() => currentMonthSummary.value?.expenses ?? 0)
const saved = computed(() => currentMonthSummary.value?.saved ?? 0)


// Total balance across all active accounts
const totalBalance = computed(() =>
  store.activeAccounts.reduce((s, a) => s + a.balance, 0),
)

// Pending amounts — from API summary (authoritative) with 0 fallback while loading
const pendingIncome = computed(() => currentMonthSummary.value?.pending_income ?? 0)
const pendingExpenses = computed(() => currentMonthSummary.value?.pending_expenses ?? 0)

// Projected balance: local fallback for current month, corrected by API for future months.
const localProjectedBalance = computed(() =>
  totalBalance.value + pendingIncome.value - pendingExpenses.value
)

const { projectedBalance: historicalProjected } = useHistoricalBalance(
  computed(() => filterState.month.value),
)

// Displayed projected balance: API value (cumulative for future months) with local fallback
const projectedBalance = computed(() => historicalProjected.value ?? localProjectedBalance.value)

// ── Balance detail sheet ──────────────────────────────────────────────────────
const balanceSheetOpen = ref(false)
const balanceSheetTitle = ref('Saldo atual')
const balanceSheetAmount = ref(0)

function openBalanceSheet(title: string, amount: number) {
  balanceSheetTitle.value = title
  balanceSheetAmount.value = amount
  balanceSheetOpen.value = true
}

// Enrichment stats for mobile summary row
const transactionCount = computed(() =>
  currentMonthSummary.value?.transactions_count ?? store.transactions.length
)

const biggestExpense = computed(() => {
  // Aportes em meta são poupança — não concorrem a "maior despesa"
  const exp = store.transactions.filter((t) => t.type === 'expense' && !t.goal_id)
  if (!exp.length) return null
  return exp.reduce((max, t) => (t.amount > max.amount ? t : max))
})



// Grouped categories panel:
// Group A — categories WITH monthly_limit (always shown, even R$0 spent)
// Group B — categories with transactions but NO monthly_limit (show with "Definir meta" CTA)
type CategoryEntry = {
  id: string; name: string; color: string; icon: string | null
  total: number; monthlyLimit: number | null
  percent: number; budgetPercent: number | null
}

const categoriesWithMeta = computed<CategoryEntry[]>(() => {
  // Sum transactions per category
  const spent = new Map<string, number>()
  store.transactions
    .filter((t) => t.type === 'expense' && t.category)
    .forEach((t) => {
      spent.set(t.category!.id, (spent.get(t.category!.id) ?? 0) + t.amount)
    })

  const totalExpenses = Array.from(spent.values()).reduce((s, v) => s + v, 0)

  return store.categories
    .filter((c) => c.type === 'expense' && c.monthly_limit != null && c.monthly_limit > 0)
    .map((c) => {
      const total = spent.get(c.id) ?? 0
      const budgetPercent = Math.min(150, Math.round((total / c.monthly_limit!) * 100))
      return {
        id: c.id, name: c.name, color: c.color, icon: c.icon ?? null,
        total, monthlyLimit: c.monthly_limit,
        percent: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
        budgetPercent,
      }
    })
    .sort((a, b) => b.budgetPercent! - a.budgetPercent!)
})

const categoriesWithoutMeta = computed<CategoryEntry[]>(() => {
  const totalExpenses = store.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const map = new Map<string, CategoryEntry>()
  store.transactions
    .filter((t) => t.type === 'expense' && t.category)
    .forEach((t) => {
      const cat = t.category!
      const storeCat = store.categories.find((c) => c.id === cat.id)
      if (storeCat?.monthly_limit) return // already covered in categoriesWithMeta
      const entry = map.get(cat.id)
      if (entry) { entry.total += t.amount; return }
      map.set(cat.id, {
        id: cat.id, name: cat.name, color: cat.color,
        icon: storeCat?.icon ?? cat.icon ?? null,
        total: t.amount, monthlyLimit: null,
        percent: 0, budgetPercent: null,
      })
    })

  return Array.from(map.values())
    .map((c) => ({ ...c, percent: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
})

// Keep for backward-compat references (exceededCategory alert)
const topCategories = computed<CategoryEntry[]>(() => [
  ...categoriesWithMeta.value,
  ...categoriesWithoutMeta.value,
])

// Budget base: the month's planned budget when it exists; income as fallback.
// Using raw income breaks early in the month (salary lands on day 10 → "spent 100%").
const budgetBase = computed(() => {
  const base = Number(store.currentBudget?.base_amount ?? 0)
  return base > 0 ? base : income.value
})

// Budget usage: expenses as % of the budget base
const budgetPercent = computed(() =>
  budgetBase.value > 0 ? Math.min(100, Math.round((expenses.value / budgetBase.value) * 100)) : 0,
)

// Days remaining in the current month
const daysLeftInMonth = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
})


// Mobile status chip — mirrors the Lovable MonthSummary status logic
const mobileStatus = computed(() => {
  if (exceededCategory.value) {
    return {
      tone: 'danger' as const,
      text: `${exceededCategory.value.name} ultrapassou a meta em ${formatCurrency(exceededCategory.value.total - (exceededCategory.value.monthlyLimit ?? 0))}`,
    }
  }
  if (budgetPercent.value >= 80) {
    return {
      tone: 'warn' as const,
      text: `Já gastou ${budgetPercent.value}% — faltam ${daysLeftInMonth.value} dias no mês`,
    }
  }
  return { tone: 'ok' as const, text: 'Você está no ritmo certo para este mês' }
})


// ── Filter chips (fusão da antiga tela Transações) ──────────────────────────
type ChipId = QuickFilter | 'transfer'

const activeChip = ref<ChipId>('all')

const CHIPS: { id: ChipId; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'income', label: 'Receitas' },
  { id: 'expense', label: 'Despesas' },
  { id: 'transfer', label: 'Transferências' },
  { id: 'fix', label: 'Fixas' },
  { id: 'pending', label: 'Pendentes' },
]

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
}

// Conta / Categoria (server-side via composable)
function setAccount(id: string | undefined) {
  filterState.setAccountId(id)
  loadTransactions()
}

function setCategory(id: string | undefined) {
  filterState.setCategoryId(id)
  loadTransactions()
}

const selectedAccountName = computed(() =>
  filterState.account_id.value
    ? store.activeAccounts.find((a) => a.id === filterState.account_id.value)?.name ?? null
    : null,
)

const selectedCategoryName = computed(() =>
  filterState.category_id.value
    ? store.categories.find((c) => c.id === filterState.category_id.value)?.name ?? null
    : null,
)

const filterableCategories = computed(() => {
  if (activeChip.value === 'income') return store.categories.filter((c) => c.type === 'income')
  if (activeChip.value === 'expense') return store.categories.filter((c) => c.type === 'expense')
  return store.categories
})

// Dia do mês (client-side, sobre o mês carregado)
const selectedDay = ref<string | null>(null)

function selectDay(day: string | null) {
  selectedDay.value = selectedDay.value === day ? null : day
}

function formatDayLabel(dateStr: string): string {
  const day = parseInt(dateStr.split('-')[2] ?? '0')
  return `Dia ${day}`
}

const monthDays = computed(() => {
  const parts = filterState.month.value.split('-').map(Number)
  const year = parts[0]!
  const mon = parts[1]!
  const daysInMonth = new Date(year, mon, 0).getDate()
  const txDates = new Set(store.transactions.map((t) => t.transaction_date))
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return { day, dateStr, hasTx: txDates.has(dateStr) }
  })
})

const displayedTransactions = computed(() =>
  selectedDay.value
    ? store.transactions.filter((t) => t.transaction_date === selectedDay.value)
    : store.transactions,
)

const hasAnyFilter = computed(() =>
  activeChip.value !== 'all' ||
  !!filterState.account_id.value ||
  !!filterState.category_id.value ||
  !!selectedDay.value ||
  !!filterState.search.value,
)

// Search toggle for transaction container
const txSearchOpen = ref(false)
function closeSearch() {
  txSearchOpen.value = false
  filterState.search.value = ''
  loadTransactions()
}
watch(filterState.search, () => loadTransactions())


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

// incomeDelta reserved for future use
// const incomeDelta = computed(() => prevMonthReport.value ? income.value - prevMonthReport.value.income : null)

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

// ── First exceeded category (for alert banner) ────────────────────────────
const exceededCategory = computed(() =>
  topCategories.value.find((c) => c.budgetPercent != null && c.budgetPercent >= 100) ?? null
)

// ── Pagination ───────────────────────────────────────────────────────────────

/** True when backend has more transactions than the current page holds */
const hasMoreTransactions = computed(() => {
  const meta = store.transactionsMeta
  return meta != null && meta.total > store.transactions.length
})

const loadingAll = ref(false)

async function loadTransactions() {
  await store.fetchTransactions(filterState.toApiFilters())
}

/** Re-fetch with a very high per_page to get all transactions at once */
async function loadAllTransactions() {
  loadingAll.value = true
  try {
    await store.fetchTransactions({ ...filterState.toApiFilters(), per_page: 9999 })
  } finally {
    loadingAll.value = false
  }
}

// Reload when month or quick-filter changes
watch(() => filterState.month.value, () => {
  currentMonthSummary.value = null
  selectedDay.value = null
  loadTransactions()
  loadCurrentMonthSummary()
  loadPrevMonthReport()
  // Budget of the viewed month drives the budget bar base
  const [y, m] = filterState.month.value.split('-').map(Number)
  store.fetchBudget(m!, y!)
})
watch(() => filterState.quickFilter.value, () => loadTransactions())
watch(() => filterState.category_id.value, () => loadTransactions())

function openEdit(t: Transaction) {
  editingTransaction.value = t
  transactionPrefill.value = null
  formOpen.value = true
}

// openWithPrefill reserved for quick-shortcut feature
// function openWithPrefill(prefill: TransactionPrefill) { ... }

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
  const installmentGroupId = deletingTransaction.value.installment_group_id
  const id = deletingTransaction.value.id
  try {
    await store.deleteTransaction(id)
    if (isRecurring && groupId) {
      store.removeTransactionGroup(groupId)
    } else if (installmentGroupId) {
      store.transactions = store.transactions.filter(
        (t) => t.installment_group_id !== installmentGroupId,
      )
    }
    loadCurrentMonthSummary()
    toast.success(isRecurring ? 'Série fix excluída' : 'Transação excluída')
    deleteOpen.value = false
    deletingTransaction.value = null
  } catch {
    toast.error('Erro ao excluir transação')
  } finally {
    deleting.value = false
  }
}

const route = useRoute()

onMounted(async () => {
  // Drill-down vindo da tela de Contas: /finance?account_id=...
  if (typeof route.query.account_id === 'string' && route.query.account_id) {
    filterState.setAccountId(route.query.account_id)
  }
  const now = new Date()
  await Promise.all([
    store.fetchAll(),
    loadTransactions(),
    loadCurrentMonthSummary(),
    loadPrevMonthReport(),
    store.fetchBudget(now.getMonth() + 1, now.getFullYear()),
    store.fetchGoals(),
  ])
})
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />

    <!-- Hidden OFX file input -->
    <input
      ref="ofxInputRef"
      type="file"
      accept=".ofx,.csv,.OFX,.CSV"
      class="hidden"
      @change="handleOfxFile"
    />

    <!-- Header -->
    <PageHeader
      title="Visão geral"
      subtitle="Contas, cartões, despesas e receitas em uma única tela funcional."
    >
      <template #actions>
        <!-- StreakChip -->
        <button
          type="button"
          :aria-label="`Streak de ${streak} dias`"
          class="inline-flex items-center gap-1 h-9 px-2.5 rounded-full bg-card text-[12px] font-semibold tabular-nums hover:bg-muted active:scale-95 transition-all"
          :class="streakActive ? 'text-warning' : 'text-muted-foreground'"
          @click="streakSheetOpen = true"
        >
          <Flame class="size-3.5" :class="streakActive ? '' : 'opacity-50'" />
          {{ streak }}
        </button>

        <!-- Nova transação (hidden on mobile) -->
        <button
          type="button"
          class="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] lg:h-7 lg:px-2 lg:text-[11.5px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
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
              class="min-w-9 h-9 grid place-items-center rounded-md bg-card text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <MoreHorizontal class="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem class="cursor-pointer" @click="triggerOfxImport">
              <Upload class="size-4 mr-2" /> Importar OFX
            </DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer" @click="$router.push({ name: 'finance-categories' })">
              <Tag class="size-4 mr-2" /> Gerenciar categorias
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </PageHeader>

    <!-- Desktop: resumo à esquerda (fixo), transações à direita. Mobile: empilhado -->
    <div class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-5 lg:items-start max-w-[1200px]">
    <div>
    <!-- Month Summary -->
    <div class="mb-4 space-y-3">

      <!-- Main card: month nav + stats + budget + status chip + vs mês anterior -->
      <MonthSummaryCard
        :month="filterState.month.value"
        :is-current-month="filterState.isCurrentMonth()"
        :income="income"
        :expenses="expenses"
        :saved="saved"
        :budget-percent="budgetPercent"
        :budget-base="budgetBase"
        :status="mobileStatus"
        :expense-delta="expenseDelta"
        :loading="store.loading"
        :transaction-count="transactionCount"
        :biggest-expense="biggestExpense"
        :pending-income="pendingIncome"
        :pending-expenses="pendingExpenses"
        @prev="filterState.prevMonth()"
        @next="filterState.nextMonth()"
        @reset="filterState.resetToCurrentMonth()"
        @select-month="filterState.month.value = $event"
      />

      <!-- Pendentes da semana — confirmação 1-toque -->
      <PendingThisWeekCard @confirmed="onWeeklyPendingConfirmed" />

      <!-- Saldo previsto -->
      <div v-if="filterState.month.value >= currentMonth() && !store.loading" class="bg-card rounded-lg p-4">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Calendar :size="16" class="text-primary" />
          </div>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Saldo Previsto
          </p>
        </div>

        <!-- Values — 2 columns, both clickable -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[12px] text-muted-foreground mb-1">Saldo atual</p>
            <button
              type="button"
              class="flex items-center gap-1 hover:opacity-80 transition-opacity"
              @click="openBalanceSheet('Saldo atual', totalBalance)"
            >
              <span
                class="text-[20px] font-semibold tabular-nums leading-none"
                :class="totalBalance >= 0 ? 'text-success' : 'text-destructive'"
              >{{ formatCurrency(totalBalance) }}</span>
              <ChevronRight :size="14" class="text-muted-foreground mt-0.5" />
            </button>
          </div>
          <div>
            <p class="text-[12px] text-muted-foreground mb-1">Saldo previsto</p>
            <button
              type="button"
              class="flex items-center gap-1 hover:opacity-80 transition-opacity"
              @click="openBalanceSheet('Saldo previsto', projectedBalance)"
            >
              <span
                class="text-[20px] font-semibold tabular-nums leading-none"
                :class="projectedBalance >= 0 ? 'text-success' : 'text-destructive'"
              >{{ formatCurrency(projectedBalance) }}</span>
              <ChevronRight :size="14" class="text-muted-foreground mt-0.5" />
            </button>
          </div>
        </div>

        <!-- Footer note -->
        <div class="border-t border-border mt-3 pt-3">
          <p class="text-[11px] text-muted-foreground leading-snug">
            considera transações agendadas e recorrentes pendentes
          </p>
        </div>
      </div>

      <!-- Cashflow summary -->
      <div v-if="!store.loading" class="bg-card rounded-lg p-4">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Fluxo de caixa</p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground">Entrada</p>
            <p class="text-[17px] font-semibold tabular-nums text-success mt-1">{{ formatCurrency(income) }}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground">Saída</p>
            <p class="text-[17px] font-semibold tabular-nums text-destructive mt-1">{{ formatCurrency(expenses) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert banner — category budget exceeded -->
    <div
      v-if="exceededCategory && !store.loading"
      class="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-4 bg-muted "
    >
      <AlertTriangle :size="14" class="text-destructive shrink-0" aria-hidden="true" />
      <p class="text-[12px] text-destructive font-medium leading-snug">
        <span class="font-semibold">{{ exceededCategory.name }}</span>
        ultrapassou a meta em {{ formatCurrency(exceededCategory.total - (exceededCategory.monthlyLimit ?? 0)) }}
      </p>
    </div>
    </div>

    <!-- Transactions — Lovable-style self-contained container -->
        <div class="bg-card rounded-lg overflow-hidden">

          <!-- Header row: title + month nav + search -->
          <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <template v-if="!txSearchOpen">
              <h2 class="text-[14px] font-semibold flex items-center gap-2">
                Transações
                <!-- "X de Y" counter when paginated -->
                <span
                  v-if="hasMoreTransactions"
                  class="text-[11px] font-normal text-muted-foreground tabular-nums"
                >
                  {{ store.transactions.length }} de {{ store.transactionsMeta?.total }}
                </span>
              </h2>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Buscar"
                  class="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  @click="txSearchOpen = true"
                >
                  <Search :size="16" />
                </button>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-2 w-full animate-fade-in">
                <Search :size="14" class="text-muted-foreground shrink-0" />
                <input
                  v-model="filterState.search.value"
                  autofocus
                  placeholder="Buscar transação..."
                  class="flex-1 bg-transparent outline-none text-[13px] h-9"
                />
                <button
                  type="button"
                  class="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
                  @click="closeSearch"
                >
                  <X :size="16" />
                </button>
              </div>
            </template>
          </div>

          <!-- Filter chips — inside container with border-b -->
          <div class="px-3 py-2 border-b border-border overflow-x-auto scrollbar-none scroll-fade-x">
            <div class="flex items-center gap-1.5 w-max">
              <button
                v-for="f in CHIPS"
                :key="f.id"
                type="button"
                class="h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors duration-150 shrink-0"
                :class="activeChip === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'"
                @click="setChip(f.id)"
              >
                {{ f.label }}
              </button>

              <!-- Divider -->
              <div class="w-px h-5 bg-border shrink-0 self-center" />

              <!-- Conta -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    type="button"
                    class="h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                    :class="selectedAccountName
                      ? 'bg-muted text-primary'
                      : 'bg-muted text-muted-foreground hover:text-foreground'"
                  >
                    <span class="max-w-[100px] truncate">{{ selectedAccountName ?? 'Conta' }}</span>
                    <ChevronDown :size="10" class="shrink-0" />
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

              <!-- Categoria -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    type="button"
                    class="h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                    :class="selectedCategoryName
                      ? 'bg-muted text-primary'
                      : 'bg-muted text-muted-foreground hover:text-foreground'"
                  >
                    <span class="max-w-[100px] truncate">{{ selectedCategoryName ?? 'Categoria' }}</span>
                    <ChevronDown :size="10" class="shrink-0" />
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

              <!-- Dia do mês -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    type="button"
                    class="h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                    :class="selectedDay
                      ? 'bg-muted text-primary'
                      : 'bg-muted text-muted-foreground hover:text-foreground'"
                  >
                    {{ selectedDay ? formatDayLabel(selectedDay) : 'Data' }}
                    <ChevronDown :size="10" class="shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-56 p-2">
                  <button
                    type="button"
                    class="w-full text-left text-[12px] px-2 py-1.5 rounded-md transition-colors hover:bg-muted"
                    :class="!selectedDay ? 'text-primary font-medium' : 'text-muted-foreground'"
                    @click="selectDay(null)"
                  >
                    Todos os dias
                  </button>
                  <div class="mt-1.5 border-t border-border pt-2">
                    <div class="grid grid-cols-7 gap-0.5">
                      <button
                        v-for="{ day, dateStr, hasTx } in monthDays"
                        :key="dateStr"
                        type="button"
                        class="h-7 rounded-md text-[11px] tabular-nums transition-colors"
                        :class="selectedDay === dateStr
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : hasTx
                            ? 'text-foreground hover:bg-muted font-medium'
                            : 'text-muted-foreground hover:bg-muted'"
                        @click="selectDay(dateStr)"
                      >
                        {{ day }}
                      </button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <!-- Transaction list — nested inside bg-card, no outer  -->
          <TransactionList
            :transactions="displayedTransactions"
            :loading="store.loading"
            :nested="true"
            :has-filter="hasAnyFilter"
            :total-balance="totalBalance"
            :total-count="store.transactionsMeta?.total"
            :loading-all="loadingAll"
            :highlighted-id="newlyCreatedId ?? undefined"
            @select="openDetail"
            @add-new="formOpen = true"
            @load-all="loadAllTransactions"
            @confirm="handleQuickConfirm"
            @quick-delete="openDelete"
            @quick-duplicate="onDetailDuplicate"
          />
        </div>
    </div>

  </AppPageContainer>

  <BalanceDetailSheet
    v-model:open="balanceSheetOpen"
    :title="balanceSheetTitle"
    :total-amount="balanceSheetAmount"
  />

  <!-- Dialogs -->
  <TransactionFormDialog
    v-model:open="formOpen"
    :transaction="editingTransaction"
    :prefill="transactionPrefill"
    @created="onTransactionCreated"
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
    @duplicate="onDetailDuplicate"
    @delete="onDetailDelete"
    @confirmed="handleTransactionConfirmed"
  />

  <!-- Streak info sheet -->
  <Sheet v-model:open="streakSheetOpen">
    <SheetContent side="bottom" class="rounded-t-2xl p-5 max-w-xl mx-auto">
      <div class="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-border" />
      <SheetHeader class="text-left">
        <SheetTitle class="text-[15px] flex items-center gap-2">
          <Flame class="size-4 text-warning" />
          {{ streak }} dias seguidos
        </SheetTitle>
        <SheetDescription class="text-[12px]">
          {{ streakActive
            ? 'Você está registrando há vários dias seguidos. Continue assim!'
            : 'Você ainda não registrou nada hoje. Registre uma transação para manter sua sequência.' }}
        </SheetDescription>
      </SheetHeader>
      <button
        v-if="!streakActive"
        type="button"
        class="w-full mt-4 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-md text-[14.5px] lg:h-8 lg:px-2.5 lg:text-[12.5px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
        @click="streakSheetOpen = false; editingTransaction = null; transactionPrefill = null; formOpen = true"
      >
        <Plus class="size-4" /> Registrar agora
      </button>
    </SheetContent>
  </Sheet>
</template>
