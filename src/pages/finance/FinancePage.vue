<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { AppPageContainer, PageHeader } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import FinanceSummaryCards from '@/features/finance/components/FinanceSummaryCards.vue'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
import TransactionToolbar from '@/features/finance/components/TransactionToolbar.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useTransactionFilters } from '@/features/finance/composables/useTransactionFilters'
import { useDebounce } from '@/composables/useDebounce'
import { useToast } from '@/composables/useToast'
import type { Transaction } from '@/types/finance'
import { ref } from 'vue'

const store = useFinanceStore()
const filterState = useTransactionFilters()
const toast = useToast()

const formOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)

const debouncedSearch = useDebounce(filterState.search, 300)

// Computed summary from loaded transactions
const income = computed(() =>
  store.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0),
)

const expenses = computed(() =>
  store.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0),
)

// Client-side filter for search
const filteredTransactions = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase()
  if (!q) return store.transactions
  return store.transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(q) ||
      (t.category?.name ?? '').toLowerCase().includes(q) ||
      (t.account?.name ?? '').toLowerCase().includes(q) ||
      (t.credit_card?.name ?? '').toLowerCase().includes(q),
  )
})

async function loadTransactions() {
  await store.fetchTransactions(filterState.toApiFilters())
}

// Re-fetch when month changes
watch(
  () => filterState.month.value,
  () => loadTransactions(),
)

// Re-fetch when server-side filters change (type, category, account)
watch(
  [() => filterState.type.value, () => filterState.category_id.value, () => filterState.account_id.value],
  () => loadTransactions(),
)

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
    <PageHeader
      category="FINANÇAS"
      title="Finanças"
      subtitle="Transações e receitas em uma visão única funcional."
    >
      <template #actions>
        <span class="text-xs text-muted-foreground hidden sm:inline">
          {{ store.activeAccounts.length }} conta{{ store.activeAccounts.length !== 1 ? 's' : '' }}
        </span>
      </template>
    </PageHeader>

    <!-- Sub-navigation -->
    <FinanceSubNav />

    <!-- Month + Summary -->
    <div class="flex items-center justify-between mb-3">
      <MonthNavigator
        :month="filterState.month.value"
        :is-current-month="filterState.isCurrentMonth()"
        @prev="filterState.prevMonth()"
        @next="filterState.nextMonth()"
        @reset="filterState.resetToCurrentMonth()"
      />
    </div>

    <FinanceSummaryCards
      :income="income"
      :expenses="expenses"
      :loading="store.loading"
      class="mb-4"
    />

    <!-- Toolbar -->
    <div class="mb-3">
      <TransactionToolbar
        :filter-state="filterState"
        :search="filterState.search.value"
        :loading="store.loading"
        @create="openCreate"
        @update:search="filterState.search.value = $event"
      />
    </div>

    <!-- Transaction list -->
    <TransactionList
      :transactions="filteredTransactions"
      :loading="store.loading"
      @edit="openEdit"
      @delete="openDelete"
    />
  </AppPageContainer>

  <!-- Form dialog -->
  <TransactionFormDialog
    v-model:open="formOpen"
    :transaction="editingTransaction"
    @created="loadTransactions"
    @updated="loadTransactions"
  />

  <!-- Delete confirm -->
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
