<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import MonthNavigator from '@/features/finance/components/MonthNavigator.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import { ConfirmDialog } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useTransactionFilters } from '@/features/finance/composables/useTransactionFilters'
import { useToast } from '@/composables/useToast'
import type { Transaction } from '@/types/finance'

const store = useFinanceStore()
const filterState = useTransactionFilters()
const toast = useToast()

const formOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)

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
          Transações
        </h1>
        <p class="text-[13px] text-muted-foreground/50">
          Histórico completo de receitas e despesas.
        </p>
      </div>
      <Button size="sm" class="h-8 text-[12px] shrink-0 sm:mt-1" @click="openCreate">
        <Plus :size="12" class="mr-1.5" />
        Transação
      </Button>
    </div>

    <FinanceSubNav />

    <!-- Month navigator -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
        Todas as transações
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
  </AppPageContainer>

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
