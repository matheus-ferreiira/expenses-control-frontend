<script setup lang="ts">
import { computed, nextTick, watch, onMounted, ref } from 'vue'
import { ChevronRight, X, Plus, Upload, Flame, MoreHorizontal, Search, Calendar, CalendarClock, CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AppPageContainer } from '@/components/shared'
import FinanceSummaryCards from '@/features/finance/components/FinanceSummaryCards.vue'
import FinanceCashflowChart from '@/features/finance/components/FinanceCashflowChart.vue'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
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
import { utilizationPercent, monthLabel as getMonthLabel, getCardBillingPeriod, currentMonth } from '@/features/finance/utils/financeHelpers'
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

// Credit card used amount — filtered by real billing period, not calendar month.
// store.transactions only covers the selected month, so amounts near billing boundaries
// may be partial. For the exact value, see the dedicated CardsPage which loads 60 days.
function cardUsed(cardId: string): number {
  const card = store.activeCards.find((c) => c.id === cardId)
  if (!card) return 0
  const period = getCardBillingPeriod(card.closing_day, card.due_day)
  return store.transactions
    .filter((t) =>
      t.card_id === cardId &&
      t.type === 'expense' &&
      t.transaction_date >= period.startDate &&
      t.transaction_date <= period.endDate,
    )
    .reduce((s, t) => s + t.amount, 0)
}

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
  const exp = store.transactions.filter((t) => t.type === 'expense')
  if (!exp.length) return null
  return exp.reduce((max, t) => (t.amount > max.amount ? t : max))
})

const today = new Date().getDate()

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

// Budget usage: expenses as % of income
const budgetPercent = computed(() =>
  income.value > 0 ? Math.min(100, Math.round((expenses.value / income.value) * 100)) : 0,
)

// Days remaining in the current month
const daysLeftInMonth = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
})

// Custom period picker for desktop
const showPeriodPicker = ref(false)
const periodStartDate = ref('')
const periodEndDate = ref('')

function applyCustomPeriod() {
  if (periodStartDate.value && periodEndDate.value) {
    filterState.customStartDate.value = periodStartDate.value
    filterState.customEndDate.value = periodEndDate.value
    filterState.applyCustomRange()
    showPeriodPicker.value = false
  }
}

function clearCustomPeriod() {
  filterState.clearCustomRange()
  periodStartDate.value = ''
  periodEndDate.value = ''
}

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

// Search toggle for transaction container
const txSearchOpen = ref(false)
function closeSearch() {
  txSearchOpen.value = false
  filterState.search.value = ''
  loadTransactions()
}
watch(filterState.search, () => loadTransactions())

// Date range row toggle
const txPeriodOpen = ref(false)

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
  loadTransactions()
  loadCurrentMonthSummary()
  loadPrevMonthReport()
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

onMounted(async () => {
  await Promise.all([store.fetchAll(), loadTransactions(), loadCurrentMonthSummary(), loadPrevMonthReport()])
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
        <p class="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/80 mb-0.5">
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
          class="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] lg:h-7 lg:px-2 lg:text-[11.5px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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


    <!-- Hero: total balance — desktop only, no card wrapper -->
    <div v-if="!store.loading" class="hidden lg:block mb-6">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Saldo total</p>
      <p
        class="text-[36px] font-semibold tabular-nums tracking-tight leading-none"
        :class="totalBalance >= 0 ? 'text-foreground' : 'text-destructive'"
      >
        {{ formatCurrency(totalBalance) }}
      </p>
      <p class="text-[13px] text-muted-foreground/60 mt-1">
        {{ store.activeAccounts.length }} conta{{ store.activeAccounts.length !== 1 ? 's' : '' }} ativa{{ store.activeAccounts.length !== 1 ? 's' : '' }}
      </p>
    </div>

    <!-- Summary cards (4 KPI) — always first -->
    <FinanceSummaryCards
      :income="income"
      :expenses="expenses"
      :total-balance="totalBalance"
      :projected-balance="projectedBalance"
      :is-current-month="filterState.month.value >= currentMonth()"
      :loading="store.loading"
      :month-label="kpiMonthLabel"
      :account-count="store.activeAccounts.length"
      class="mt-4 mb-4"
    />

    <!-- Mobile Month Summary — lg:hidden, matches Lovable MonthSummary -->
    <div class="lg:hidden mb-4 space-y-3">

      <!-- Main card: month nav + stats + budget + status chip + vs mês anterior -->
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex justify-center mb-3">
          <MonthNavigator
            :month="filterState.month.value"
            :is-current-month="filterState.isCurrentMonth()"
            @prev="filterState.prevMonth()"
            @next="filterState.nextMonth()"
            @reset="filterState.resetToCurrentMonth()"
            @select-month="filterState.month.value = $event"
          />
        </div>

        <!-- 3-column stats -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Receitas</p>
            <p class="block text-[17px] font-semibold text-success tabular-nums mt-1">{{ formatCurrency(income) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Despesas</p>
            <p class="block text-[17px] font-semibold text-destructive tabular-nums mt-1">{{ formatCurrency(expenses) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Saldo do mês</p>
            <p class="block text-[17px] font-semibold tabular-nums mt-1">{{ formatCurrency(income - expenses) }}</p>
          </div>
        </div>

        <!-- Budget bar with amounts text -->
        <div class="mt-4">
          <div class="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>Orçamento do mês</span>
            <div class="flex flex-col items-end">
              <span class="tabular-nums font-medium text-foreground">{{ formatCurrency(expenses) }} de {{ formatCurrency(income) }}</span>
              <span class="tabular-nums text-muted-foreground/60">{{ budgetPercent }}%</span>
            </div>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{ width: `${budgetPercent}%` }"
              :class="mobileStatus.tone === 'danger' ? 'bg-destructive' : mobileStatus.tone === 'warn' ? 'bg-warning' : 'bg-primary'"
            />
          </div>
        </div>

        <!-- Status contextual chip -->
        <div
          class="mt-3 flex items-center gap-2 rounded-md border px-2.5 py-2 text-[12px] font-medium"
          :class="mobileStatus.tone === 'danger'
            ? 'bg-destructive/10 text-destructive border-destructive/30'
            : mobileStatus.tone === 'warn'
              ? 'bg-warning/10 text-warning border-warning/30'
              : 'bg-success/10 text-success border-success/30'"
        >
          <CheckCircle2 v-if="mobileStatus.tone === 'ok'" :size="14" class="shrink-0" />
          <AlertTriangle v-else :size="14" class="shrink-0" />
          <span class="leading-snug">{{ mobileStatus.text }}</span>
        </div>

        <!-- vs mês anterior -->
        <div
          v-if="expenseDelta !== null && !store.loading"
          class="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground"
        >
          <span>vs mês anterior:</span>
          <span
            class="inline-flex items-center gap-0.5 font-semibold tabular-nums"
            :class="expenseDelta <= 0 ? 'text-success' : 'text-destructive'"
          >
            {{ expenseDelta <= 0 ? '↓' : '↑' }}
            {{ expenseDelta <= 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(expenseDelta)) }} em despesas
          </span>
        </div>

        <!-- Enrichment row: count + biggest expense + pending -->
        <div
          v-if="!store.loading"
          class="mt-3 pt-3 border-t border-border/40 grid gap-3"
          :class="(pendingIncome > 0 || pendingExpenses > 0) ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <div>
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Transações</p>
            <p class="text-[14px] font-semibold tabular-nums text-foreground">{{ transactionCount }} no mês</p>
          </div>
          <div v-if="biggestExpense">
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Maior despesa</p>
            <p class="text-[14px] font-semibold tabular-nums text-destructive">{{ formatCurrency(biggestExpense.amount) }}</p>
            <p class="text-[11px] text-muted-foreground/50 truncate leading-tight mt-0.5">{{ biggestExpense.category?.name ?? biggestExpense.description }}</p>
          </div>
          <div v-if="pendingIncome > 0 || pendingExpenses > 0">
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Pendentes</p>
            <p class="text-[13px] tabular-nums font-medium leading-snug">
              <span v-if="pendingIncome > 0" class="text-success/70">+{{ formatCurrency(pendingIncome) }}</span>
              <span v-if="pendingIncome > 0 && pendingExpenses > 0" class="text-muted-foreground/30 mx-0.5">·</span>
              <span v-if="pendingExpenses > 0" class="text-destructive/70">-{{ formatCurrency(pendingExpenses) }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Saldo previsto -->
      <div v-if="filterState.month.value >= currentMonth() && !store.loading" class="bg-card border border-border rounded-lg p-4">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar :size="16" class="text-primary" />
          </div>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Saldo Previsto
          </p>
        </div>

        <!-- Values — 2 columns, both clickable -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[12px] text-muted-foreground/50 mb-1">Saldo atual</p>
            <button
              type="button"
              class="flex items-center gap-1 hover:opacity-80 transition-opacity"
              @click="openBalanceSheet('Saldo atual', totalBalance)"
            >
              <span
                class="text-[20px] font-semibold tabular-nums leading-none"
                :class="totalBalance >= 0 ? 'text-success' : 'text-destructive'"
              >{{ formatCurrency(totalBalance) }}</span>
              <ChevronRight :size="14" class="text-muted-foreground/30 mt-0.5" />
            </button>
          </div>
          <div>
            <p class="text-[12px] text-muted-foreground/50 mb-1">Saldo previsto</p>
            <button
              type="button"
              class="flex items-center gap-1 hover:opacity-80 transition-opacity"
              @click="openBalanceSheet('Saldo previsto', projectedBalance)"
            >
              <span
                class="text-[20px] font-semibold tabular-nums leading-none"
                :class="projectedBalance >= 0 ? 'text-success' : 'text-destructive'"
              >{{ formatCurrency(projectedBalance) }}</span>
              <ChevronRight :size="14" class="text-muted-foreground/30 mt-0.5" />
            </button>
          </div>
        </div>

        <!-- Footer note -->
        <div class="border-t border-border/40 mt-3 pt-3">
          <p class="text-[11px] text-muted-foreground/70 leading-snug">
            considera transações agendadas e recorrentes pendentes
          </p>
        </div>
      </div>

      <!-- Cashflow summary (mobile only — desktop has the full chart) -->
      <div v-if="!store.loading" class="bg-card border border-border rounded-lg p-4">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Fluxo de caixa</p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground/70">Entrada</p>
            <p class="text-[17px] font-semibold tabular-nums text-success mt-1">{{ formatCurrency(income) }}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground/70">Saída</p>
            <p class="text-[17px] font-semibold tabular-nums text-destructive mt-1">{{ formatCurrency(expenses) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert banner — category budget exceeded -->
    <div
      v-if="exceededCategory && !store.loading"
      class="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-4 bg-destructive/10 border border-destructive/20"
    >
      <AlertTriangle :size="14" class="text-destructive shrink-0" aria-hidden="true" />
      <p class="text-[12px] text-destructive/90 font-medium leading-snug">
        <span class="font-semibold">{{ exceededCategory.name }}</span>
        ultrapassou a meta em {{ formatCurrency(exceededCategory.total - (exceededCategory.monthlyLimit ?? 0)) }}
      </p>
    </div>

    <!-- Month comparison line (desktop only — mobile uses status chip inside summary card) -->
    <div
      v-if="expenseDelta !== null && !store.loading"
      class="hidden lg:flex items-center gap-1.5 mb-4 text-[12px]"
    >
      <span class="text-muted-foreground/50">vs mês anterior:</span>
      <span
        class="flex items-center gap-0.5 font-medium tabular-nums"
        :class="expenseDelta <= 0 ? 'text-success' : 'text-destructive'"
      >
        {{ expenseDelta <= 0 ? '↓' : '↑' }}
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

        <!-- Transactions — Lovable-style self-contained container -->
        <div class="bg-card border border-border rounded-lg overflow-hidden">

          <!-- Header row: title + month nav + search -->
          <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <template v-if="!txSearchOpen">
              <h2 class="text-[14px] font-semibold flex items-center gap-2">
                Transações
                <!-- "X de Y" counter when paginated -->
                <span
                  v-if="hasMoreTransactions"
                  class="text-[11px] font-normal text-muted-foreground/60 tabular-nums"
                >
                  {{ store.transactions.length }} de {{ store.transactionsMeta?.total }}
                </span>
              </h2>
              <div class="flex items-center gap-1">
                <!-- Month nav only on desktop — mobile uses the summary card nav -->
                <div class="hidden lg:flex items-center gap-1">
                  <MonthNavigator
                    :month="filterState.month.value"
                    :is-current-month="filterState.isCurrentMonth()"
                    @prev="filterState.prevMonth()"
                    @next="filterState.nextMonth()"
                    @reset="filterState.resetToCurrentMonth()"
                    @select-month="filterState.month.value = $event"
                  />
                  <!-- Custom period picker button -->
                  <DropdownMenu v-model:open="showPeriodPicker">
                    <DropdownMenuTrigger class="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" asChild>
                      <button type="button" aria-label="Período personalizado" :class="filterState.useCustomRange ? 'text-foreground' : ''">
                        <Calendar :size="16" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" class="w-64 p-3 space-y-2">
                      <div class="text-[11px] font-semibold text-foreground mb-2">Período personalizado</div>
                      <div class="space-y-2">
                        <div class="flex flex-col">
                          <label class="text-[11px] text-muted-foreground mb-1">De:</label>
                          <input
                            v-model="periodStartDate"
                            type="date"
                            class="px-2 py-1.5 rounded text-sm bg-background border border-border"
                          />
                        </div>
                        <div class="flex flex-col">
                          <label class="text-[11px] text-muted-foreground mb-1">Até:</label>
                          <input
                            v-model="periodEndDate"
                            type="date"
                            class="px-2 py-1.5 rounded text-sm bg-background border border-border"
                          />
                        </div>
                      </div>
                      <div class="flex gap-2 pt-2">
                        <button
                          type="button"
                          @click="applyCustomPeriod"
                          :disabled="!periodStartDate || !periodEndDate"
                          class="flex-1 px-2 py-1.5 rounded text-[11px] font-medium bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90"
                        >
                          Aplicar
                        </button>
                        <button
                          v-if="filterState.useCustomRange"
                          type="button"
                          @click="clearCustomPeriod"
                          class="flex-1 px-2 py-1.5 rounded text-[11px] font-medium border border-border hover:bg-muted"
                        >
                          Limpar
                        </button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                v-for="f in QUICK_FILTERS"
                :key="f.id"
                type="button"
                class="h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors duration-150 shrink-0"
                :class="filterState.quickFilter.value === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
                @click="filterState.setQuickFilter(f.id)"
              >
                {{ f.label }}
              </button>
            </div>
          </div>

          <!-- Date range filter — desktop only, toggled via header -->
          <div
            v-if="txPeriodOpen"
            class="hidden lg:flex items-center gap-2 px-4 py-2 border-b border-border"
          >
            <span class="text-[10px] text-muted-foreground/50 shrink-0">Período:</span>
            <input
              v-model="filterState.customStartDate.value"
              type="date"
              class="h-6 px-1.5 rounded border border-border/60 bg-transparent text-[11px] text-foreground/80 outline-none focus:border-border"
            />
            <span class="text-[10px] text-muted-foreground/40">–</span>
            <input
              v-model="filterState.customEndDate.value"
              type="date"
              class="h-6 px-1.5 rounded border border-border/60 bg-transparent text-[11px] text-foreground/80 outline-none focus:border-border"
            />
            <button
              type="button"
              class="h-6 px-2.5 rounded text-[11px] font-medium transition-all"
              :class="filterState.useCustomRange.value ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/60'"
              @click="filterState.useCustomRange.value ? (filterState.clearCustomRange(), loadTransactions()) : (filterState.applyCustomRange(), loadTransactions())"
            >
              {{ filterState.useCustomRange.value ? 'Limpar' : 'Filtrar' }}
            </button>
          </div>

          <!-- Transaction list — nested inside bg-card, no outer border -->
          <TransactionList
            :transactions="store.transactions"
            :loading="store.loading"
            :nested="true"
            :has-filter="filterState.quickFilter.value !== 'all' || !!filterState.search.value"
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

      <!-- Sidebar column -->
      <div class="lg:col-span-1 space-y-4">

        <!-- Contas -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[16px] font-semibold text-foreground">Contas</h2>
            <div class="flex items-center gap-3">
              <RouterLink
                :to="{ name: 'finance-accounts', query: { new: '1' } }"
                class="text-[12px] text-primary/70 hover:text-primary transition-colors"
              >
                + Nova
              </RouterLink>
              <RouterLink
                :to="{ name: 'finance-accounts' }"
                class="text-[12px] text-primary hover:text-primary/80 transition-colors"
              >
                Ver todas →
              </RouterLink>
            </div>
          </div>

          <!-- Loading skeleton -->
          <div v-if="store.loading">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <div class="w-10 h-10 rounded-xl bg-muted/60 animate-pulse shrink-0" />
              <div class="flex-1 space-y-1.5">
                <div class="h-3 w-24 rounded bg-muted/60 animate-pulse" />
                <div class="h-2.5 w-16 rounded bg-muted/60 animate-pulse" />
              </div>
              <div class="h-4 w-20 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="store.activeAccounts.length === 0" class="flex flex-col items-center py-6 gap-1">
            <p class="text-[13px] text-muted-foreground/60">Nenhuma conta cadastrada</p>
            <p class="text-[12px] text-muted-foreground/40">Adicione uma conta para acompanhar seu saldo</p>
          </div>

          <!-- Account rows -->
          <div v-else>
            <div
              v-for="account in store.activeAccounts.slice(0, 4)"
              :key="account.id"
              class="flex items-center gap-3 py-3 border-b border-border/30 last:border-0"
            >
              <span
                class="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-[13px] shrink-0"
                :style="{
                  background: account.color ? account.color + '26' : 'hsl(var(--primary) / 0.15)',
                  color: account.color ?? 'hsl(var(--primary))',
                }"
              >
                {{ account.name.slice(0, 2).toUpperCase() }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-medium text-foreground truncate leading-tight">{{ account.name }}</p>
                <p class="text-[12px] text-muted-foreground/50 mt-0.5 capitalize truncate">
                  {{ account.bank_name || account.type }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span
                  class="text-[14px] font-semibold tabular-nums"
                  :class="account.balance >= 0 ? 'text-success' : 'text-destructive'"
                >
                  {{ formatCurrency(account.balance) }}
                </span>
                <ChevronRight :size="14" class="text-muted-foreground/30" />
              </div>
            </div>
          </div>
        </div>

        <!-- Cartões -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[16px] font-semibold text-foreground">Cartões</h2>
            <div class="flex items-center gap-3">
              <RouterLink
                :to="{ name: 'finance-cards', query: { new: '1' } }"
                class="text-[12px] text-primary/70 hover:text-primary transition-colors"
              >
                + Nova
              </RouterLink>
              <RouterLink
                :to="{ name: 'finance-cards' }"
                class="text-[12px] text-primary hover:text-primary/80 transition-colors"
              >
                Ver todos →
              </RouterLink>
            </div>
          </div>

          <!-- Loading skeleton -->
          <div v-if="store.loading">
            <div v-for="i in 2" :key="i" class="py-3 border-b border-border/30 last:border-0 space-y-2">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-muted/60 animate-pulse shrink-0" />
                <div class="flex-1 h-3 rounded bg-muted/60 animate-pulse" />
                <div class="h-3 w-16 rounded bg-muted/60 animate-pulse" />
              </div>
              <div class="h-1 w-full rounded-full bg-muted/60 animate-pulse ml-6" />
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="store.activeCards.length === 0" class="flex flex-col items-center py-6 gap-1">
            <p class="text-[13px] text-muted-foreground/60">Nenhum cartão cadastrado</p>
            <p class="text-[12px] text-muted-foreground/40">Adicione um cartão para acompanhar seus gastos</p>
          </div>

          <!-- Card rows -->
          <div v-else>
            <div
              v-for="card in store.activeCards.slice(0, 3)"
              :key="card.id"
              class="flex flex-col gap-2 py-3 border-b border-border/30 last:border-0"
            >
              <!-- Row 1: dot + name + usage amount -->
              <div class="flex items-center gap-3">
                <div
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ background: card.color || 'hsl(var(--muted-foreground))' }"
                />
                <p class="text-[14px] font-medium text-foreground flex-1 truncate">{{ card.name }}</p>
                <span class="text-[14px] font-semibold tabular-nums text-foreground shrink-0">
                  {{ formatCurrency(cardUsed(card.id)) }}
                </span>
              </div>
              <!-- Row 2: bar + meta text -->
              <div class="pl-6">
                <div class="h-1 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :style="{
                      width: utilizationPercent(cardUsed(card.id), card.limit_amount) + '%',
                      background: utilizationPercent(cardUsed(card.id), card.limit_amount) >= 80
                        ? 'hsl(var(--destructive) / 0.7)'
                        : (card.color || 'hsl(var(--primary))'),
                    }"
                  />
                </div>
                <p class="text-[11px] text-muted-foreground/40 mt-1 tabular-nums">
                  Limite {{ formatCurrency(card.limit_amount) }} · Vence dia {{ card.due_day }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming bills — within 10 days -->
        <div v-if="!store.loading && upcomingBills.length > 0" class="bg-card border border-border rounded-lg overflow-hidden">
          <header class="flex items-center gap-2 px-3.5 h-9 border-b border-border">
            <CalendarClock :size="13" class="text-warning shrink-0" />
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
      <div class="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
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
        class="w-full mt-4 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-md text-[14.5px] lg:h-8 lg:px-2.5 lg:text-[12.5px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        @click="streakSheetOpen = false; editingTransaction = null; transactionPrefill = null; formOpen = true"
      >
        <Plus class="size-4" /> Registrar agora
      </button>
    </SheetContent>
  </Sheet>
</template>
