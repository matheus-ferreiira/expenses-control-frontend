<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, Pencil, Check, X, Plus, Upload } from 'lucide-vue-next'
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

async function loadTransactions() {
  await store.fetchTransactions(filterState.toApiFilters())
}

// Reload when month or quick-filter changes
watch(() => filterState.month.value, () => loadTransactions())
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
  await Promise.all([store.fetchAll(), loadTransactions()])
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
    <div class="mb-6">
      <div class="flex items-start justify-between mb-3">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5">
            Finanças
          </p>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none mb-1.5">
            Visão geral
          </h1>
          <p class="text-[13px] text-muted-foreground/50">
            Contas, cartões, despesas e receitas em uma única tela funcional.
          </p>
        </div>
      </div>

      <!-- Action row: streak + buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Streak badge -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-medium transition-colors shrink-0"
          :class="streakActive
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            : 'bg-muted/40 border-border/50 text-muted-foreground/50 hover:bg-muted'"
          @click="streakSheetOpen = true"
        >
          <span>{{ streakActive ? '🔥' : '🩶' }}</span>
          <span>{{ streak }} dia{{ streak !== 1 ? 's' : '' }}</span>
        </button>

        <div class="flex-1" />

        <!-- Importar OFX -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          @click="triggerOfxImport"
        >
          <Upload :size="12" />
          Importar OFX
        </button>

        <!-- Nova transação -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
          @click="editingTransaction = null; transactionPrefill = null; formOpen = true"
        >
          <Plus :size="12" />
          Transação
        </button>
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

    <!-- 2-column layout: main (2/3) + sidebar (1/3) -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

      <!-- Main column -->
      <div class="xl:col-span-2 space-y-6">

        <!-- Cashflow chart — anchored to the selected month -->
        <FinanceCashflowChart :month="filterState.month.value" />

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
            @select="openDetail"
          />
        </div>

      </div>

      <!-- Sidebar column — contextual info (Sprint 3) -->
      <div class="xl:col-span-1 space-y-4">

        <!-- Accounts mini-list -->
        <div class="rounded-lg border border-border/50 bg-card p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              Contas
            </p>
            <RouterLink
              :to="{ name: 'finance-accounts' }"
              class="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-base"
            >
              Ver todas
            </RouterLink>
          </div>
          <div v-if="store.loading" class="space-y-2.5">
            <div v-for="i in 3" :key="i" class="flex items-center justify-between">
              <div class="h-3 w-24 rounded bg-muted/60 animate-pulse" />
              <div class="h-3 w-16 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div v-else-if="store.activeAccounts.length === 0" class="text-[12px] text-muted-foreground/40 py-2">
            Nenhuma conta cadastrada
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="account in store.activeAccounts.slice(0, 4)"
              :key="account.id"
              class="flex items-center gap-3"
            >
              <span
                class="rounded-lg grid place-items-center shrink-0 w-9 h-9 text-xs font-bold"
                :style="{
                  background: (account.color || '#888') + '22',
                  color: account.color || 'hsl(var(--muted-foreground))',
                }"
              >
                {{ account.name.charAt(0).toUpperCase() }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[12px] font-medium text-foreground/80 truncate">{{ account.name }}</p>
                <p class="text-[10px] text-muted-foreground/60 truncate">{{ account.bank_name || account.type }}</p>
              </div>
              <span
                :class="['text-[12px] font-medium tabular-nums shrink-0', account.balance < 0 ? 'text-destructive/70' : 'text-foreground/70']"
              >
                {{ account.balance < 0 ? '-' : '' }}{{ formatCurrency(Math.abs(account.balance)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Cards mini-list -->
        <div class="rounded-lg border border-border/50 bg-card p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              Cartões
            </p>
            <RouterLink
              :to="{ name: 'finance-cards' }"
              class="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-base"
            >
              Ver todos
            </RouterLink>
          </div>
          <div v-if="store.loading" class="space-y-2.5">
            <div v-for="i in 2" :key="i" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="h-3 w-24 rounded bg-muted/60 animate-pulse" />
                <div class="h-3 w-12 rounded bg-muted/60 animate-pulse" />
              </div>
              <div class="h-1 w-full rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div v-else-if="store.activeCards.length === 0" class="text-[12px] text-muted-foreground/40 py-2">
            Nenhum cartão cadastrado
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="card in store.activeCards.slice(0, 3)"
              :key="card.id"
            >
              <div class="flex items-center gap-3 mb-1.5">
                <span
                  class="rounded-lg grid place-items-center shrink-0 w-8 h-8 text-xs font-bold"
                  :style="{
                    background: (card.color || '#888') + '22',
                    color: card.color || 'hsl(var(--muted-foreground))',
                  }"
                >
                  {{ card.name.charAt(0).toUpperCase() }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-medium text-foreground/80 truncate">{{ card.name }}</p>
                  <p class="text-[10px] text-muted-foreground/60">vence dia {{ card.due_day }}</p>
                </div>
                <span class="text-[11px] tabular-nums text-muted-foreground/50 shrink-0">
                  {{ utilizationPercent(cardUsed(card.id), card.limit_amount) }}%
                </span>
              </div>
              <div class="h-1 rounded-full overflow-hidden bg-muted/40">
                <div
                  class="h-full rounded-full transition-all"
                  :class="
                    utilizationPercent(cardUsed(card.id), card.limit_amount) >= 80
                      ? 'bg-destructive/60'
                      : utilizationPercent(cardUsed(card.id), card.limit_amount) >= 50
                        ? 'bg-warning/70'
                        : 'bg-success/60'
                  "
                  :style="{ width: utilizationPercent(cardUsed(card.id), card.limit_amount) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Category spending — top 5 with budget limits -->
        <div class="rounded-lg border border-border/50 bg-card p-4">
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-3">
            Gastos por categoria
          </p>
          <div v-if="store.loading" class="space-y-2.5">
            <div v-for="i in 5" :key="i" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="h-2.5 w-24 rounded bg-muted/60 animate-pulse" />
                <div class="h-2.5 w-8 rounded bg-muted/60 animate-pulse" />
              </div>
              <div class="h-1 w-full rounded-full bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div v-else-if="topCategories.length === 0" class="text-[12px] text-muted-foreground/40 py-2">
            Sem despesas este mês
          </div>
          <div v-else class="space-y-3">
            <div v-for="cat in topCategories" :key="cat.name">
              <!-- Inline budget editor -->
              <div v-if="editingBudgetCatId === cat.id" class="flex items-center gap-1.5 mb-1.5">
                <span class="h-1.5 w-1.5 rounded-full shrink-0" :style="{ background: cat.color }" />
                <span class="text-[12px] text-foreground/70 truncate flex-1">{{ cat.name }}</span>
                <input
                  v-model="editingBudgetValue"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="Limite"
                  class="w-20 h-6 text-[11px] px-1.5 rounded border border-border bg-background text-foreground text-right"
                  @keyup.enter="saveBudget(cat.id)"
                  @keyup.escape="cancelEditBudget"
                />
                <button
                  type="button"
                  class="size-6 flex items-center justify-center rounded text-success hover:bg-success/10 transition-colors"
                  :disabled="savingBudget"
                  @click="saveBudget(cat.id)"
                >
                  <Check :size="12" />
                </button>
                <button
                  type="button"
                  class="size-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
                  @click="cancelEditBudget"
                >
                  <X :size="12" />
                </button>
              </div>

              <!-- Normal display -->
              <template v-else>
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="h-1.5 w-1.5 rounded-full shrink-0" :style="{ background: cat.color }" />
                    <span class="text-[12px] text-foreground/70 truncate">{{ cat.name }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0 ml-2">
                    <span class="text-[11px] text-muted-foreground/50">{{ cat.percent }}%</span>
                    <button
                      type="button"
                      class="size-4 flex items-center justify-center rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                      title="Definir meta"
                      @click="startEditBudget(cat.id, cat.monthlyLimit)"
                    >
                      <Pencil :size="9" />
                    </button>
                  </div>
                </div>

                <!-- Budget bar (if limit set) -->
                <template v-if="cat.budgetPercent != null">
                  <div class="h-1 rounded-full overflow-hidden bg-muted/40 mb-0.5">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="
                        cat.budgetPercent >= 90 ? 'bg-destructive' :
                        cat.budgetPercent >= 70 ? 'bg-warning' : 'bg-success'
                      "
                      :style="{ width: cat.budgetPercent + '%' }"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-muted-foreground/40 tabular-nums">
                      {{ formatCurrency(cat.total) }} de {{ formatCurrency(cat.monthlyLimit!) }}
                    </span>
                    <span
                      v-if="cat.budgetPercent >= 100"
                      class="text-[9px] font-medium text-destructive/80"
                    >
                      Meta estourada
                    </span>
                    <span v-else class="text-[10px] text-muted-foreground/40 tabular-nums">
                      {{ cat.budgetPercent }}% da meta
                    </span>
                  </div>
                </template>

                <!-- Simple bar (no limit) -->
                <div v-else class="h-1 rounded-full overflow-hidden bg-muted/40">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{ width: cat.percent + '%', background: cat.color + '99' }"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Upcoming bills — cards due within 10 days -->
        <div v-if="!store.loading && upcomingBills.length > 0" class="rounded-lg border border-border/50 bg-card p-4">
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-3">
            Próximos vencimentos
          </p>
          <div class="space-y-2.5">
            <div
              v-for="card in upcomingBills"
              :key="card.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div
                  class="h-2 w-2 rounded-full shrink-0"
                  :style="{ background: card.color || 'hsl(var(--muted-foreground))' }"
                />
                <span class="text-[12px] text-foreground/80 truncate">{{ card.name }}</span>
              </div>
              <span
                :class="[
                  'text-[11px] shrink-0 ml-2 font-medium',
                  card.due_day - today === 0
                    ? 'text-destructive/80'
                    : card.due_day - today <= 3
                      ? 'text-warning/80'
                      : 'text-muted-foreground/50',
                ]"
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
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div
        v-if="streakSheetOpen"
        class="fixed inset-0 z-50 flex items-end"
        @click.self="streakSheetOpen = false"
      >
        <div class="absolute inset-0 bg-black/50" @click="streakSheetOpen = false" />
        <div class="relative w-full rounded-t-2xl bg-card border-t border-border p-6 pb-8 z-10">
          <div class="flex flex-col items-center text-center gap-3">
            <span class="text-5xl">{{ streakActive ? '🔥' : '🩶' }}</span>
            <div>
              <p class="text-xl font-semibold text-foreground">
                {{ streakActive
                  ? `Você está registrando há ${streak} dia${streak !== 1 ? 's' : ''} seguidos!`
                  : 'Nenhum registro hoje ainda.' }}
              </p>
              <p class="text-[13px] text-muted-foreground/60 mt-1">
                {{ streakActive ? 'Continue assim! 💪' : 'Registre uma transação para começar seu streak.' }}
              </p>
            </div>
            <button
              type="button"
              class="mt-2 h-9 px-5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              @click="streakSheetOpen = false; editingTransaction = null; transactionPrefill = null; formOpen = true"
            >
              + Registrar agora
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
