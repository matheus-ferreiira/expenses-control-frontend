<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { Plus, Upload } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import FinanceSummaryCards from '@/features/finance/components/FinanceSummaryCards.vue'
import FinanceCashflowChart from '@/features/finance/components/FinanceCashflowChart.vue'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useTransactionFilters } from '@/features/finance/composables/useTransactionFilters'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { utilizationPercent } from '@/features/finance/utils/financeHelpers'
import type { Transaction } from '@/types/finance'

const store = useFinanceStore()
const filterState = useTransactionFilters()
const toast = useToast()

const formOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)

// Monthly income/expenses from loaded transactions
const income = computed(() =>
  store.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
)
const expenses = computed(() =>
  store.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
)

// Total balance across all active accounts
const totalBalance = computed(() =>
  store.activeAccounts.reduce((s, a) => s + a.balance, 0),
)

async function loadTransactions() {
  await store.fetchTransactions(filterState.toApiFilters())
}

watch(() => filterState.month.value, () => loadTransactions())

function openCreate() {
  editingTransaction.value = null
  formOpen.value = true
}

function openEdit(t: Transaction) {
  editingTransaction.value = t
  formOpen.value = true
}

function openDelete(id: string) {
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
          Fluxo de caixa, contas e transações do mês
        </p>
      </div>
      <div class="flex items-center gap-2 sm:mt-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          class="h-8 text-[12px] text-muted-foreground/70 border-border/60 hover:text-foreground"
          disabled
        >
          <Upload :size="12" class="mr-1.5" />
          Importar OFX
        </Button>
        <Button size="sm" class="h-8 text-[12px]" @click="openCreate">
          <Plus :size="12" class="mr-1.5" />
          Transação
        </Button>
      </div>
    </div>

    <!-- Sub-nav -->
    <FinanceSubNav />

    <!-- Summary cards -->
    <FinanceSummaryCards
      :income="income"
      :expenses="expenses"
      :total-balance="totalBalance"
      :loading="store.loading"
      class="mb-6"
    />

    <!-- 2-column layout: main (2/3) + sidebar (1/3) -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

      <!-- Main column -->
      <div class="xl:col-span-2 space-y-6">

        <!-- Cashflow chart -->
        <FinanceCashflowChart />

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
          <TransactionList
            :transactions="store.transactions"
            :loading="store.loading"
            @edit="openEdit"
            @delete="openDelete"
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
              class="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
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
          <div v-else class="space-y-2.5">
            <div
              v-for="account in store.activeAccounts.slice(0, 4)"
              :key="account.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div
                  class="h-2 w-2 rounded-full shrink-0"
                  :style="{ background: account.color || 'hsl(var(--muted-foreground))' }"
                />
                <span class="text-[12px] text-foreground/80 truncate">{{ account.name }}</span>
              </div>
              <span
                :class="['text-[12px] font-medium tabular-nums shrink-0 ml-2', account.balance < 0 ? 'text-destructive/70' : 'text-foreground/70']"
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
              class="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
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
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[12px] text-foreground/80 truncate">{{ card.name }}</span>
                <span class="text-[11px] text-muted-foreground/50 shrink-0 ml-2">
                  vence dia {{ card.due_day }}
                </span>
              </div>
              <div class="h-1 rounded-full overflow-hidden bg-muted/40">
                <div
                  class="h-full rounded-full transition-all"
                  :class="
                    utilizationPercent(card.current_balance, card.credit_limit) >= 80
                      ? 'bg-destructive/60'
                      : utilizationPercent(card.current_balance, card.credit_limit) >= 50
                        ? 'bg-warning/70'
                        : 'bg-success/60'
                  "
                  :style="{ width: utilizationPercent(card.current_balance, card.credit_limit) + '%' }"
                />
              </div>
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
    title="Excluir transação"
    description="Esta ação não pode ser desfeita."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
