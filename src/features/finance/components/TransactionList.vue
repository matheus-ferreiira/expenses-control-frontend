<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { Search, Inbox, Plus, Loader2, ChevronDown, AlertCircle } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { groupTransactionsByDate } from '../utils/financeHelpers'
import TransactionCard from './TransactionCard.vue'

const props = defineProps<{
  transactions: Transaction[]
  loading?: boolean
  /** When true, the list renders without its own outer card border (already inside a parent container). */
  nested?: boolean
  /** Show when there are no results due to search/filter (vs truly empty). */
  hasFilter?: boolean
  /** Total account balance for computing end-of-day running balance. */
  totalBalance?: number
  /**
   * Total count from the backend pagination meta. When provided and greater than
   * transactions.length, a "load all" banner is shown at the bottom of the list.
   */
  totalCount?: number
  /** True while the "load all" fetch is in progress — shows spinner in the banner. */
  loadingAll?: boolean
  /** ID of a just-created transaction to highlight temporarily */
  highlightedId?: string
  /** Month context: drives empty-state copy. */
  monthContext?: 'current' | 'past' | 'future'
  /** Error message to display instead of the transaction list. */
  error?: string | null
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
  addNew: []
  /** Emitted when the user clicks "Carregar todas" in the truncation banner. */
  loadAll: []
  /** Emitted when the user clicks "Tentar novamente" in the error state. */
  retry: []
}>()

const groups = computed(() => groupTransactionsByDate(props.transactions, props.totalBalance))

/** True when the backend has more results than what's currently loaded. */
const isTruncated = computed(() =>
  props.totalCount != null && props.totalCount > props.transactions.length,
)
</script>

<template>
  <!-- Loading -->
  <div v-if="loading">
    <div v-for="i in 3" :key="i">
      <div class="flex items-center justify-between px-4 pt-2.5 pb-1">
        <Skeleton class="h-2.5 w-14" />
        <Skeleton class="h-2.5 w-16" />
      </div>
      <div v-for="j in 2" :key="j" class="flex items-center gap-3 px-4 py-3 min-h-[48px]">
        <Skeleton class="size-10 rounded-xl shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3 w-1/2" />
          <Skeleton class="h-2.5 w-1/4" />
        </div>
        <Skeleton class="h-3.5 w-20 shrink-0" />
      </div>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="flex flex-col items-center justify-center py-16 gap-3">
    <div class="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
      <AlertCircle :size="22" class="text-destructive/60" />
    </div>
    <p class="text-[14px] font-semibold text-foreground">Erro ao carregar transações</p>
    <p class="text-[12px] text-muted-foreground/50">Verifique sua conexão e tente novamente</p>
    <button
      type="button"
      class="text-[13px] text-primary font-medium mt-1"
      @click="emit('retry')"
    >
      Tentar novamente
    </button>
  </div>

  <!-- Empty state -->
  <div v-else-if="transactions.length === 0" class="flex flex-col items-center justify-center py-16">
    <div class="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center">
      <component
        :is="hasFilter ? Search : Inbox"
        :size="22"
        class="text-muted-foreground/40"
      />
    </div>
    <p class="text-[15px] font-semibold text-foreground mt-4">
      {{ hasFilter
        ? 'Nenhuma transação encontrada'
        : monthContext === 'past'
          ? 'Sem transações neste período'
          : 'Nenhum gasto ainda este mês' }}
    </p>
    <p class="text-[13px] text-muted-foreground/50 mt-1 text-center max-w-[220px]">
      {{ hasFilter
        ? 'Ajuste os filtros ou registre uma nova.'
        : monthContext === 'past'
          ? 'Nenhuma movimentação registrada neste mês.'
          : 'Ótimo começo! Registre sua primeira transação.' }}
    </p>
    <button
      v-if="!hasFilter && monthContext !== 'past'"
      type="button"
      class="mt-4 inline-flex items-center gap-1.5 h-10 px-5 rounded-lg border border-border text-foreground text-[13px] font-medium hover:bg-muted/40 active:scale-95 transition-all"
      @click="emit('addNew')"
    >
      <Plus :size="14" /> Registrar agora
    </button>
  </div>

  <!-- Grouped list -->
  <div v-else :class="nested ? '' : 'rounded-md border border-border overflow-clip'">
    <template v-for="group in groups" :key="group.date">
      <!-- Date header -->
      <div class="flex justify-between items-center mt-5 mb-1 px-1">
        <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {{ group.label }}
        </span>
        <span
          v-if="group.income !== 0 || group.expenses !== 0"
          class="text-[12px] tabular-nums text-muted-foreground/40"
        >
          {{ group.income >= group.expenses ? '+' : '-' }}{{ formatCurrency(Math.abs(group.income - group.expenses)) }}
        </span>
      </div>

      <!-- Transactions -->
      <ul class="divide-y divide-border/20">
        <TransactionCard
          v-for="t in group.transactions"
          :key="t.id"
          :transaction="t"
          :highlighted="t.id === highlightedId"
          @select="emit('select', $event)"
        />
      </ul>
    </template>

    <!-- Truncation banner — shown when backend has more results than current page -->
    <div
      v-if="isTruncated"
      class="border-t border-border/60 px-4 py-3 flex items-center justify-between gap-3"
    >
      <p class="text-[12px] text-muted-foreground/70">
        Exibindo <span class="font-semibold text-foreground">{{ transactions.length }}</span>
        de <span class="font-semibold text-foreground">{{ totalCount }}</span> transações neste período.
      </p>
      <button
        type="button"
        :disabled="loadingAll"
        class="flex-shrink-0 inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-semibold border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="emit('loadAll')"
      >
        <Loader2 v-if="loadingAll" :size="11" class="animate-spin" />
        <ChevronDown v-else :size="11" />
        {{ loadingAll ? 'Carregando...' : 'Carregar todas' }}
      </button>
    </div>
  </div>
</template>
