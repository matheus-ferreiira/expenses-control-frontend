<script setup lang="ts">
import { computed, nextTick, watch, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, X, Plus, Search, AlertTriangle, PiggyBank, SlidersHorizontal } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AppPageContainer, PageHeader } from '@/components/shared'
import MonthSummaryCard, { type MonthMode } from '@/features/finance/components/MonthSummaryCard.vue'
import CategoryBreakdownList from '@/features/finance/components/CategoryBreakdownList.vue'
import CategoryTransactionsSheet from '@/features/finance/components/CategoryTransactionsSheet.vue'
import PendingThisWeekCard from '@/features/finance/components/PendingThisWeekCard.vue'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog, { type TransactionPrefill } from '@/features/finance/components/TransactionFormDialog.vue'
import TransactionDetailSheet from '@/features/finance/components/TransactionDetailSheet.vue'
import BalanceDetailSheet from '@/features/finance/components/BalanceDetailSheet.vue'
import CreditCardCard from '@/features/finance/components/CreditCardCard.vue'
import CardStatementSheet from '@/features/finance/components/CardStatementSheet.vue'
import ConfirmTransactionSheet from '@/features/finance/components/ConfirmTransactionSheet.vue'
import RecurringEditScopeDialog from '@/features/finance/components/RecurringEditScopeDialog.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { financeApi } from '@/services/api/finance'
import { useTransactionFilters, type QuickFilter } from '@/features/finance/composables/useTransactionFilters'
import { useHistoricalBalance } from '@/features/finance/composables/useHistoricalBalance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { currentMonth, formatDayMonth } from '@/features/finance/utils/financeHelpers'
import type { CardOverview, CategoryBreakdownItem, CreditCard, RecurrenceUpdateScope, Transaction } from '@/types/finance'

const store = useFinanceStore()
const filterState = useTransactionFilters()
const toast = useToast()

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
    card_id: t.card_id ?? undefined,
  }
  // Duplicate with today as date and without recurrence/installments
  // (fromTransaction in the form clears is_recurring and total_installments)
  formOpen.value = true
}

async function handleTransactionConfirmed(updated: Transaction) {
  const idx = store.transactions.findIndex((t) => t.id === updated.id)
  if (idx !== -1) store.transactions[idx] = updated
  await Promise.all([store.fetchAll(), loadCurrentMonthSummary(), loadCardOverviews()])
  toast.success('Transação confirmada')
}

// Quick confirm from the list opens "Paguei / Recebi" with the real amount and date
const quickConfirmTarget = ref<Transaction | null>(null)
const quickConfirmOpen = ref(false)

function handleQuickConfirm(t: Transaction) {
  quickConfirmTarget.value = t
  quickConfirmOpen.value = true
}

/** Card "Pendentes da semana" confirmou algo — recarrega saldos, resumo e lista */
async function onWeeklyPendingConfirmed() {
  await Promise.all([store.fetchAll(), loadTransactions(), loadCurrentMonthSummary(), loadCardOverviews()])
}

const isRecurringDelete = computed(() => !!deletingTransaction.value?.recurrence_group_id)
const deleteDescription = computed(() =>
  deletingTransaction.value?.installment_group_id
    ? 'Esta é uma compra parcelada: todas as parcelas serão excluídas. Esta ação não pode ser desfeita.'
    : 'Esta ação não pode ser desfeita.',
)

// Current month authoritative totals from backend — not affected by pagination.
// Falls back to 0 while loading or on error.
type MonthlySummary = Awaited<ReturnType<typeof financeApi.monthlyReport>>
const currentMonthSummary = ref<MonthlySummary | null>(null)
const categoryType = ref<'expense' | 'income'>('expense')
const categorySheetOpen = ref(false)
const selectedBreakdownCategory = ref<CategoryBreakdownItem | null>(null)
const categoryBreakdown = computed(() => categoryType.value === 'income'
  ? currentMonthSummary.value?.income_by_category ?? []
  : currentMonthSummary.value?.expenses_by_category ?? [])

function openCategoryTransactions(category: CategoryBreakdownItem) {
  selectedBreakdownCategory.value = category
  categorySheetOpen.value = true
}

function openCategoryTransactionDetail(transaction: Transaction) {
  categorySheetOpen.value = false
  openDetail(transaction)
}

async function loadCurrentMonthSummary() {
  const viewed = filterState.month.value
  const [year, month] = viewed.split('-').map(Number)
  try {
    const summary = await financeApi.monthlyReport(year!, month!)
    if (filterState.month.value === viewed) currentMonthSummary.value = summary
  } catch {
    if (filterState.month.value === viewed) currentMonthSummary.value = null
  }
}

const income = computed(() => currentMonthSummary.value?.income ?? 0)
const expenses = computed(() => currentMonthSummary.value?.expenses ?? 0)
const saved = computed(() => currentMonthSummary.value?.saved ?? 0)
const pendingSaved = computed(() => currentMonthSummary.value?.pending_saved ?? 0)

// The month card changes with the viewed month: closed, in progress or a forecast
const monthMode = computed<MonthMode>(() => {
  const viewed = filterState.month.value
  const now = currentMonth()
  return viewed < now ? 'past' : viewed > now ? 'future' : 'current'
})


// Available balance: active accounts except reserves (caixinhas), which show apart as "Guardado"
const totalBalance = computed(() => store.availableBalance)

// Pending amounts — from API summary (authoritative) with 0 fallback while loading
const pendingIncome = computed(() => currentMonthSummary.value?.pending_income ?? 0)
const pendingExpenses = computed(() => currentMonthSummary.value?.pending_expenses ?? 0)

// Projected balance: local fallback for current month, corrected by API for future months.
const localProjectedBalance = computed(() =>
  totalBalance.value + pendingIncome.value - pendingExpenses.value
)

const {
  projectedBalance: historicalProjected,
  cardDue,
  cardStatementsDue,
  unverifiedAccountIds,
  reload: reloadHistoricalBalance,
} = useHistoricalBalance(
  computed(() => filterState.month.value),
)

const unverifiedAccountNames = computed(() =>
  unverifiedAccountIds.value
    .map((id) => store.accounts.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(', '),
)

// Displayed projected balance: API value (cumulative for future months) with local fallback
const projectedBalance = computed(() => historicalProjected.value ?? localProjectedBalance.value)
const endOfMonthLabel = computed(() => {
  if (monthMode.value === 'current') return 'No fim do mês'
  const [y, m] = filterState.month.value.split('-').map(Number)
  return `No fim de ${new Date(y!, m! - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}`
})

// ── Cartões: fatura a pagar, fatura aberta e limite real (backend) ─────────────
const cardOverviews = ref<Record<string, CardOverview>>({})
const loadingCardOverviews = ref(false)
const statementOpen = ref(false)
const statementCard = ref<CreditCard | null>(null)
const statementCycle = ref<string | null>(null)

async function loadCardOverviews() {
  if (!store.cards.length) await store.fetchCards()
  loadingCardOverviews.value = true
  try {
    const entries = await Promise.all(
      store.activeCards.map(async (card) => [card.id, await financeApi.cards.overview(card.id)] as const),
    )
    cardOverviews.value = Object.fromEntries(entries)
  } catch {
    // o restante da Visão Geral continua funcionando sem o resumo do cartão
  } finally {
    loadingCardOverviews.value = false
  }
}

function openCardStatement(card: CreditCard, cycle?: string) {
  statementCard.value = card
  statementCycle.value = cycle ?? null
  statementOpen.value = true
}

async function onStatementPaid() {
  await Promise.all([loadCardOverviews(), loadTransactions(), loadCurrentMonthSummary(), store.fetchAccounts(), reloadHistoricalBalance()])
}

// Lançamentos feitos em qualquer tela (inclusive pelo "+" global) atualizam totais e cartões
watch(() => store.transactionsVersion, () => {
  loadCurrentMonthSummary()
  loadCardOverviews()
  reloadHistoricalBalance()
})

// ── Balance detail sheet ──────────────────────────────────────────────────────
const balanceSheetOpen = ref(false)
const balanceSheetTitle = ref('Nas contas')
const balanceSheetAmount = ref(0)

function openBalanceSheet(title: string, amount: number) {
  balanceSheetTitle.value = title
  balanceSheetAmount.value = amount
  balanceSheetOpen.value = true
}

const spentByCategory = computed(() => {
  const spent = new Map<string, number>()
  for (const c of currentMonthSummary.value?.expenses_by_category ?? []) {
    if (c.category_id) spent.set(c.category_id, c.total)
  }
  return spent
})

// Grouped categories panel:
// Group A — categories WITH monthly_limit (always shown, even R$0 spent)
// Group B — categories with spending but NO monthly_limit (show with "Definir meta" CTA)
type CategoryEntry = {
  id: string; name: string; color: string; icon: string | null
  total: number; monthlyLimit: number | null
  percent: number; budgetPercent: number | null
}

const categoriesWithMeta = computed<CategoryEntry[]>(() =>
  store.categories
    .filter((c) => c.type === 'expense' && c.monthly_limit != null && c.monthly_limit > 0)
    .map((c) => {
      const total = spentByCategory.value.get(c.id) ?? 0
      return {
        id: c.id, name: c.name, color: c.color, icon: c.icon ?? null,
        total, monthlyLimit: c.monthly_limit,
        percent: expenses.value > 0 ? Math.round((total / expenses.value) * 100) : 0,
        budgetPercent: Math.min(150, Math.round((total / c.monthly_limit!) * 100)),
      }
    })
    .sort((a, b) => b.budgetPercent! - a.budgetPercent!),
)

const categoriesWithoutMeta = computed<CategoryEntry[]>(() =>
  (currentMonthSummary.value?.expenses_by_category ?? [])
    .filter((c) => c.category_id && !store.categories.find((s) => s.id === c.category_id)?.monthly_limit)
    .map((c) => {
      const storeCat = store.categories.find((s) => s.id === c.category_id)
      return {
        id: c.category_id!, name: c.category, color: c.color, icon: storeCat?.icon ?? null,
        total: c.total, monthlyLimit: null,
        percent: expenses.value > 0 ? Math.round((c.total / expenses.value) * 100) : 0,
        budgetPercent: null,
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5),
)
// Keep for backward-compat references (exceededCategory alert)
const topCategories = computed<CategoryEntry[]>(() => [
  ...categoriesWithMeta.value,
  ...categoriesWithoutMeta.value,
])

// The viewed month's budget base, when there is one. Without it the card compares with the month's
// expected income (received + still to receive), never with what was received so far.
const budgetBase = computed(() => {
  // The store keeps the last fetched budget: use it only when it is the viewed month's
  const budget = store.currentBudget
  const [y, m] = filterState.month.value.split('-').map(Number)
  if (!budget || budget.year !== y || budget.month !== m) return null
  const base = Number(budget.base_amount)
  return base > 0 ? base : null
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
  const before = filterState.quickFilter.value
  // setQuickFilter clears the manual type, so the transfer type is set after it (it used to be wiped)
  filterState.setQuickFilter(chip === 'transfer' ? 'all' : chip)
  if (chip === 'transfer') filterState.setType('transfer')
  // The quickFilter watcher reloads only when it changes ('all' ↔ transfers keeps it at 'all')
  if (filterState.quickFilter.value === before) loadTransactions()
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

// The three main types sit inline; transfers, fixed and pending go to the "Filtros" sheet
const MAIN_CHIPS = CHIPS.filter((c) => ['all', 'income', 'expense'].includes(c.id))
const EXTRA_CHIPS = CHIPS.filter((c) => !['all', 'income', 'expense'].includes(c.id))
const filtersOpen = ref(false)
const extraChipActive = computed(() => EXTRA_CHIPS.some((c) => c.id === activeChip.value))

/** Filters that narrow the list down: show every match, without the scheduled block or the limit */
const narrowingFilter = computed(() =>
  extraChipActive.value ||
  !!filterState.account_id.value ||
  !!filterState.category_id.value ||
  !!selectedDay.value ||
  !!filterState.search.value,
)

const activeFilterPills = computed(() => {
  const pills: { key: string; label: string; clear: () => void }[] = []
  if (extraChipActive.value) {
    pills.push({ key: 'chip', label: CHIPS.find((c) => c.id === activeChip.value)!.label, clear: () => setChip('all') })
  }
  if (selectedAccountName.value) pills.push({ key: 'account', label: selectedAccountName.value, clear: () => setAccount(undefined) })
  if (selectedCategoryName.value) pills.push({ key: 'category', label: selectedCategoryName.value, clear: () => setCategory(undefined) })
  if (selectedDay.value) pills.push({ key: 'day', label: formatDayLabel(selectedDay.value), clear: () => selectDay(null) })
  return pills
})
const extraFilterCount = computed(() => activeFilterPills.value.length)

function clearExtraFilters() {
  if (extraChipActive.value) setChip('all')
  selectedDay.value = null
  // A category change reloads through its watcher; an account change alone needs an explicit reload
  const reload = !!filterState.account_id.value && !filterState.category_id.value
  filterState.setAccountId(undefined)
  filterState.setCategoryId(undefined)
  if (reload) loadTransactions()
}

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


// ── Expense comparison ────────────────────────────────────────────────────
// The closed month and the month in progress are both compared with the whole previous month (no
// day-based comparison, by the user's choice); a future month is not compared.
const comparisonData = ref<{ month: string; label: string; expenses: number } | null>(null)

async function loadComparison() {
  const viewed = filterState.month.value
  const mode = monthMode.value
  comparisonData.value = null
  if (mode === 'future') return
  const [y, m] = viewed.split('-').map(Number)
  // Built from local date parts: `new Date('2026-10-01')` is UTC and in Brazil fell on the previous day,
  // so the old code compared October with August
  const prev = new Date(y!, m! - 2, 1)
  const prevYear = prev.getFullYear()
  const prevMonth = prev.getMonth() + 1
  const name = prev.toLocaleDateString('pt-BR', { month: 'long' })
  try {
    const total = (await financeApi.monthlyReport(prevYear, prevMonth)).expenses
    if (filterState.month.value === viewed) comparisonData.value = { month: viewed, label: name, expenses: total }
  } catch {
    // sem comparação; o resto do card continua
  }
}

const expenseComparison = computed(() => {
  const c = comparisonData.value
  if (!c || c.month !== filterState.month.value || !currentMonthSummary.value) return null
  return { label: c.label, delta: Math.round((expenses.value - c.expenses) * 100) / 100 }
})

// ── First exceeded category (for alert banner) ────────────────────────────
// Exceeded only when spending goes past the limit: reaching it exactly is on budget (same rule as the backend)
const exceededCategory = computed(() =>
  topCategories.value.find((c) => c.monthlyLimit != null && c.total > c.monthlyLimit) ?? null
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
    await store.fetchAllTransactions(filterState.toApiFilters())
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
  loadComparison()
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

async function confirmDelete(scope?: RecurrenceUpdateScope) {
  if (!deletingTransaction.value) return
  deleting.value = true
  const isRecurring = isRecurringDelete.value
  const deleteScope = isRecurring && scope === 'this_and_future' ? 'this_and_future' : 'this_only'
  const installmentGroupId = deletingTransaction.value.installment_group_id
  const id = deletingTransaction.value.id
  try {
    await store.deleteTransaction(id, isRecurring ? deleteScope : undefined)
    if (isRecurring) {
      // Other occurrences may have gone too ("esta e as futuras"): reload what the server kept
      await loadTransactions()
    } else if (installmentGroupId) {
      store.transactions = store.transactions.filter(
        (t) => t.installment_group_id !== installmentGroupId,
      )
    }
    loadCurrentMonthSummary()
    toast.success(isRecurring && deleteScope === 'this_and_future' ? 'Série encerrada a partir desta' : 'Transação excluída')
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
    store.fetchAll().then(loadCardOverviews),
    loadTransactions(),
    loadCurrentMonthSummary(),
    loadComparison(),
    store.fetchBudget(now.getMonth() + 1, now.getFullYear()),
    store.fetchGoals(),
  ])
})
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />

    <!-- Header -->
    <PageHeader
      title="Visão geral"
      subtitle="Contas, cartões, despesas e receitas em uma única tela funcional."
      compact-mobile
    >
      <template #actions>
        <!-- Nova transação (hidden on mobile) -->
        <button
          type="button"
          class="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
          @click="editingTransaction = null; transactionPrefill = null; formOpen = true"
        >
          <Plus class="size-3.5" />
          Transação
        </button>

      </template>
    </PageHeader>

    <!-- Desktop: sempre 2 colunas — em telas maiores as colunas alargam -->
    <div class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
    <div>
    <!-- Month Summary -->
    <div class="mb-4 space-y-3">

      <!-- Main card: month nav + stats + budget + status chip + vs mês anterior -->
      <MonthSummaryCard
        :month="filterState.month.value"
        :mode="monthMode"
        :income="income"
        :expenses="expenses"
        :pending-income="pendingIncome"
        :pending-expenses="pendingExpenses"
        :saved="saved"
        :pending-saved="pendingSaved"
        :budget-base="budgetBase"
        :comparison="expenseComparison"
        :loading="!currentMonthSummary"
        @prev="filterState.prevMonth()"
        @next="filterState.nextMonth()"
        @reset="filterState.resetToCurrentMonth()"
        @select-month="filterState.month.value = $event"
      />

      <!-- Saldo: quanto há nas contas agora e quanto haverá no fim do mês (mês atual e futuros) -->
      <div v-if="monthMode !== 'past' && !store.loading" class="bg-card rounded-lg p-4">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Saldo</p>

        <!-- Values — 2 columns, both clickable -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[12px] text-muted-foreground mb-1">Nas contas</p>
            <button
              type="button"
              class="flex items-center gap-1 hover:opacity-80 transition-opacity"
              @click="openBalanceSheet('Nas contas', totalBalance)"
            >
              <span
                class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap"
                :class="totalBalance >= 0 ? 'text-success' : 'text-destructive'"
              >{{ formatCurrency(totalBalance) }}</span>
              <ChevronRight :size="14" class="text-muted-foreground mt-0.5 shrink-0" />
            </button>
          </div>
          <div>
            <p class="text-[12px] text-muted-foreground mb-1">{{ endOfMonthLabel }}</p>
            <button
              type="button"
              class="flex items-center gap-1 hover:opacity-80 transition-opacity"
              @click="openBalanceSheet(endOfMonthLabel, projectedBalance)"
            >
              <span
                class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap"
                :class="projectedBalance >= 0 ? 'text-success' : 'text-destructive'"
              >{{ formatCurrency(projectedBalance) }}</span>
              <ChevronRight :size="14" class="text-muted-foreground mt-0.5 shrink-0" />
            </button>
          </div>
        </div>

        <!-- Faturas de cartão descontadas do fim do mês -->
        <div v-if="cardDue > 0" class="mt-3 rounded-md bg-muted px-3 py-2 space-y-1">
          <div
            v-for="s in cardStatementsDue"
            :key="s.card_id + s.cycle"
            class="flex items-center justify-between gap-3 text-[12px]"
          >
            <span class="text-muted-foreground truncate">
              Fatura {{ s.card_name }} · vence {{ formatDayMonth(s.due_on) }}
            </span>
            <span class="tabular-nums font-medium text-destructive shrink-0">−{{ formatCurrency(s.remaining_cents / 100) }}</span>
          </div>
        </div>

        <!-- Dinheiro guardado: fora dos dois saldos -->
        <RouterLink
          v-if="store.reserveAccounts.length"
          to="/finance/accounts"
          class="mt-3 flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-[12px] hover:opacity-80 transition-opacity"
        >
          <span class="inline-flex items-center gap-1.5 text-muted-foreground min-w-0">
            <PiggyBank :size="14" class="text-primary shrink-0" />
            <span class="truncate">Guardado · {{ store.reserveAccounts.map((a) => a.name).join(', ') }}</span>
          </span>
          <span class="tabular-nums font-semibold text-primary shrink-0">{{ formatCurrency(store.reserveBalance) }}</span>
        </RouterLink>

        <p class="text-[11px] text-muted-foreground leading-snug mt-3">
          O fim do mês soma o que está agendado e desconta as faturas que vencem até lá. O gasto do dia a dia não entra.
        </p>
        <!-- Accounts counted by their recorded balance (no verified opening yet, D-17) -->
        <p v-if="unverifiedAccountNames" class="text-[11px] text-warning leading-snug mt-1">
          Inclui {{ unverifiedAccountNames }} pelo saldo registrado, ainda não conferido. Confira em Contas.
        </p>
      </div>

      <!-- A confirmar: vencidos e da semana, confirmação 1-toque (só no mês em andamento) -->
      <PendingThisWeekCard v-if="monthMode === 'current'" @confirmed="onWeeklyPendingConfirmed" />

      <!-- Cartões, versão compacta: fatura a pagar, fatura aberta e limite livre (só no mês em andamento) -->
      <template v-if="monthMode === 'current'">
        <CreditCardCard
          v-for="card in store.activeCards"
          :key="card.id"
          :card="card"
          :overview="cardOverviews[card.id] ?? null"
          :loading="loadingCardOverviews"
          compact
          @statement="openCardStatement"
        />
      </template>


      <!-- Categorias do mês selecionado (mesma base do relatório mensal) -->
      <CategoryBreakdownList
        v-if="!store.loading && currentMonthSummary"
        boxed
        compact
        selectable
        :title="categoryType === 'expense' ? 'Despesas por categoria' : 'Receitas por categoria'"
        :empty-text="categoryType === 'expense' ? 'Nenhuma despesa confirmada neste mês.' : 'Nenhuma receita confirmada neste mês.'"
        :categories="categoryBreakdown"
        @select="openCategoryTransactions"
      >
        <template #controls>
          <div class="flex gap-1 rounded-lg bg-muted p-1 mb-3" role="group" aria-label="Tipo de transações por categoria">
            <button
              v-for="option in (['expense', 'income'] as const)"
              :key="option"
              type="button"
              :aria-pressed="categoryType === option"
              class="flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="categoryType === option ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              @click="categoryType = option"
            >
              {{ option === 'expense' ? 'Despesas' : 'Receitas' }}
            </button>
          </div>
        </template>
      </CategoryBreakdownList>
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

          <!-- Filters: the three main types inline, everything else in the "Filtros" sheet -->
          <div class="flex items-center gap-2 px-3 py-2 border-b border-border">
            <div class="flex flex-1 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Tipo de transação">
              <button
                v-for="f in MAIN_CHIPS"
                :key="f.id"
                type="button"
                :aria-pressed="activeChip === f.id"
                class="flex-1 h-7 rounded-md text-[12px] font-medium transition-colors"
                :class="activeChip === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                @click="setChip(f.id)"
              >
                {{ f.label }}
              </button>
            </div>
            <button
              type="button"
              class="h-9 px-3 rounded-lg text-[12px] font-medium inline-flex items-center gap-1.5 shrink-0 transition-colors"
              :class="extraFilterCount ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'"
              @click="filtersOpen = true"
            >
              <SlidersHorizontal :size="14" />
              Filtros<template v-if="extraFilterCount"> ({{ extraFilterCount }})</template>
            </button>
          </div>

          <!-- Active extra filters, removable -->
          <div v-if="activeFilterPills.length" class="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border">
            <button
              v-for="pill in activeFilterPills"
              :key="pill.key"
              type="button"
              class="h-7 pl-2.5 pr-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-medium inline-flex items-center gap-1"
              :aria-label="`Remover filtro ${pill.label}`"
              @click="pill.clear()"
            >
              {{ pill.label }}
              <X :size="12" />
            </button>
            <button type="button" class="h-7 px-2 text-[12px] text-muted-foreground hover:text-foreground" @click="clearExtraFilters">
              Limpar
            </button>
          </div>

          <!-- Transaction list — nested inside bg-card, no outer  -->
          <TransactionList
            :key="filterState.month.value"
            :transactions="displayedTransactions"
            split-scheduled
            :limit="20"
            :show-all="narrowingFilter"
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

  <!-- Filtros: mostrar só, conta, categoria e dia -->
  <Sheet v-model:open="filtersOpen">
    <SheetContent side="bottom" class="rounded-t-2xl p-0 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
      <SheetHeader class="text-left px-5 pt-3">
        <SheetTitle class="text-[15px]">Filtros</SheetTitle>
        <SheetDescription class="text-[12px]">Valem para a lista de transações do mês.</SheetDescription>
      </SheetHeader>

      <div class="px-5 pb-6 space-y-5 mt-4">
        <section>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Mostrar só</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="f in EXTRA_CHIPS"
              :key="f.id"
              type="button"
              :aria-pressed="activeChip === f.id"
              class="h-8 px-3 rounded-full text-[12px] font-medium transition-colors"
              :class="activeChip === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'"
              @click="setChip(activeChip === f.id ? 'all' : f.id)"
            >
              {{ f.label }}
            </button>
          </div>
        </section>

        <section>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Conta</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="acc in [{ id: undefined, name: 'Todas' }, ...store.activeAccounts]"
              :key="acc.id ?? 'all'"
              type="button"
              :aria-pressed="filterState.account_id.value === acc.id"
              class="h-8 px-3 rounded-full text-[12px] font-medium transition-colors"
              :class="filterState.account_id.value === acc.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'"
              @click="setAccount(acc.id)"
            >
              {{ acc.name }}
            </button>
          </div>
        </section>

        <section>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Categoria</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="cat in [{ id: undefined, name: 'Todas' }, ...filterableCategories]"
              :key="cat.id ?? 'all'"
              type="button"
              :aria-pressed="filterState.category_id.value === cat.id"
              class="h-8 px-3 rounded-full text-[12px] font-medium transition-colors"
              :class="filterState.category_id.value === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'"
              @click="filterState.setCategoryId(cat.id)"
            >
              {{ cat.name }}
            </button>
          </div>
        </section>

        <section>
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Dia</p>
            <button v-if="selectedDay" type="button" class="text-[12px] text-primary" @click="selectDay(null)">Todos os dias</button>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="{ day, dateStr, hasTx } in monthDays"
              :key="dateStr"
              type="button"
              :aria-pressed="selectedDay === dateStr"
              class="h-9 rounded-md text-[12px] tabular-nums transition-colors"
              :class="selectedDay === dateStr
                ? 'bg-primary text-primary-foreground font-semibold'
                : hasTx
                  ? 'text-foreground bg-muted/60 hover:bg-muted font-medium'
                  : 'text-muted-foreground hover:bg-muted'"
              @click="selectDay(dateStr)"
            >
              {{ day }}
            </button>
          </div>
        </section>

        <div class="flex gap-2 pt-1">
          <button
            v-if="extraFilterCount"
            type="button"
            class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-muted text-foreground"
            @click="clearExtraFilters"
          >
            Limpar
          </button>
          <button
            type="button"
            class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-primary text-primary-foreground"
            @click="filtersOpen = false"
          >
            Ver {{ displayedTransactions.length }} transaç{{ displayedTransactions.length === 1 ? 'ão' : 'ões' }}
          </button>
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <CardStatementSheet
    v-model:open="statementOpen"
    :card="statementCard"
    :initial-cycle="statementCycle"
    @paid="onStatementPaid"
  />

  <BalanceDetailSheet
    v-model:open="balanceSheetOpen"
    :title="balanceSheetTitle"
    :total-amount="balanceSheetAmount"
  />

  <CategoryTransactionsSheet
    v-model:open="categorySheetOpen"
    :category="selectedBreakdownCategory"
    :type="categoryType"
    :month="filterState.month.value"
    @select="openCategoryTransactionDetail"
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
    :open="deleteOpen && !isRecurringDelete"
    title="Excluir transação"
    :description="deleteDescription"
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @update:open="deleteOpen = $event"
    @confirm="confirmDelete()"
  />
  <RecurringEditScopeDialog
    :open="deleteOpen && isRecurringDelete"
    mode="delete"
    :loading="deleting"
    @update:open="deleteOpen = $event"
    @confirm="confirmDelete"
  />
  <ConfirmTransactionSheet
    v-model:open="quickConfirmOpen"
    :transaction="quickConfirmTarget"
    @confirmed="handleTransactionConfirmed"
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

</template>
