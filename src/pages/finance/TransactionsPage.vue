<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Plus, Search, X } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { AppPageContainer } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import TransactionSummaryCard from '@/features/finance/components/TransactionSummaryCard.vue'
import TransactionList from '@/features/finance/components/TransactionList.vue'
import TransactionFormDialog from '@/features/finance/components/TransactionFormDialog.vue'
import TransactionDetailSheet from '@/features/finance/components/TransactionDetailSheet.vue'
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

const filteredTransactions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return store.transactions
  return store.transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(q) ||
      t.category?.name.toLowerCase().includes(q) ||
      t.account?.name.toLowerCase().includes(q) ||
      t.card?.name.toLowerCase().includes(q),
  )
})

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadTransactions() {
  await store.fetchTransactions(filterState.toApiFilters())
}

watch(() => filterState.month.value, () => loadTransactions())

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
  await Promise.all([store.fetchAll(), loadTransactions()])
})

// ── Summary card data ─────────────────────────────────────────────────────────
const totalBalance = computed(() =>
  store.activeAccounts.reduce((s, a) => s + a.balance, 0)
)
const monthIncome = computed(() =>
  store.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
)
const monthExpenses = computed(() =>
  store.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
)
const pendingIncome = computed(() =>
  store.transactions
    .filter((t) => t.status === 'pending' && t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
)
const pendingExpenses = computed(() =>
  store.transactions
    .filter((t) => t.status === 'pending' && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
)
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
      <div class="flex items-center gap-2 shrink-0 sm:mt-1">
        <!-- Search toggle button -->
        <button
          type="button"
          class="h-8 w-8 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors"
          :class="searchOpen ? 'bg-accent/40 text-foreground border-border' : ''"
          @click="toggleSearch"
        >
          <Search :size="14" />
        </button>
        <Button size="sm" class="h-8 text-[12px]" @click="openCreate">
          <Plus :size="12" class="mr-1.5" />
          Transação
        </Button>
      </div>
    </div>

    <!-- Inline search bar (expandable) -->
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
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
          />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por descrição, categoria ou conta…"
            class="w-full h-9 pl-8 pr-8 rounded-lg bg-muted/60 border border-border/50 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
            @click="clearSearch"
          >
            <X :size="13" />
          </button>
        </div>
        <!-- Result count while searching -->
        <p v-if="searchQuery" class="mt-1.5 text-[11px] text-muted-foreground/50">
          {{ filteredTransactions.length }} resultado{{ filteredTransactions.length !== 1 ? 's' : '' }}
          para "{{ searchQuery }}"
        </p>
      </div>
    </Transition>

    <FinanceSubNav />

    <!-- Period summary card: nav + RECEITAS · DESPESAS · SALDO + context line -->
    <TransactionSummaryCard
      :month="filterState.month.value"
      :income="monthIncome"
      :expenses="monthExpenses"
      :total-balance="totalBalance"
      :pending-income="pendingIncome"
      :pending-expenses="pendingExpenses"
      class="mb-4"
      @prev="filterState.prevMonth()"
      @next="filterState.nextMonth()"
      @reset="filterState.resetToCurrentMonth()"
    />

    <!-- List label -->
    <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-3">
      {{ searchQuery ? 'Resultados da busca' : 'Todas as transações' }}
    </h2>

    <TransactionList
      :transactions="filteredTransactions"
      :loading="store.loading"
      @select="openDetail"
      @add-new="openCreate"
    />
  </AppPageContainer>

  <!-- Transaction detail bottom sheet -->
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
