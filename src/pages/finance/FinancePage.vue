<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import FinanceSummaryCards from '@/features/finance/components/FinanceSummaryCards.vue'
import FinanceCashflowChart from '@/features/finance/components/FinanceCashflowChart.vue'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import TransactionDetailSheet from '@/features/finance/components/TransactionDetailSheet.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useTransactionFilters, type QuickFilter } from '@/features/finance/composables/useTransactionFilters'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { utilizationPercent, monthLabel as getMonthLabel } from '@/features/finance/utils/financeHelpers'
import type { Transaction } from '@/types/finance'

const store = useFinanceStore()
const filterState = useTransactionFilters()
const toast = useToast()

const formOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const deleteOpen = ref(false)
const deletingTransaction = ref<Transaction | null>(null)
const deleting = ref(false)

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

const today = new Date().getDate()

// Top 5 expense categories this month with percentage
const topCategories = computed(() => {
  const totalExpenses = store.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const map = new Map<string, { name: string; color: string; total: number }>()
  store.transactions
    .filter((t) => t.type === 'expense' && t.category)
    .forEach((t) => {
      const cat = t.category!
      const entry = map.get(cat.id)
      if (entry) entry.total += t.amount
      else map.set(cat.id, { name: cat.name, color: cat.color, total: t.amount })
    })

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      percent: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
    }))
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

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3 sm:gap-0">
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

    <!-- Sub-nav -->
    <FinanceSubNav />

    <!-- Summary cards (4 KPI) — always first -->
    <FinanceSummaryCards
      :income="income"
      :expenses="expenses"
      :total-balance="totalBalance"
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

        <!-- Category spending — top 5 -->
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
          <div v-else class="space-y-2.5">
            <div v-for="cat in topCategories" :key="cat.name">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="h-1.5 w-1.5 rounded-full shrink-0" :style="{ background: cat.color }" />
                  <span class="text-[12px] text-foreground/70 truncate">{{ cat.name }}</span>
                </div>
                <span class="text-[11px] text-muted-foreground/50 shrink-0 ml-2">{{ cat.percent }}%</span>
              </div>
              <div class="h-1 rounded-full overflow-hidden bg-muted/40">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{ width: cat.percent + '%', background: cat.color + '99' }"
                />
              </div>
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
</template>
