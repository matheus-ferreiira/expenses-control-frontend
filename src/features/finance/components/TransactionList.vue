<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { Search, Inbox, Plus } from 'lucide-vue-next'
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
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
  addNew: []
}>()

const groups = computed(() => groupTransactionsByDate(props.transactions))
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

  <!-- Empty state — Lovable style -->
  <div v-else-if="transactions.length === 0" class="px-8 py-12 text-center">
    <div class="size-14 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/30 border border-border grid place-items-center mb-3">
      <component
        :is="hasFilter ? Search : Inbox"
        :size="24"
        class="text-muted-foreground"
      />
    </div>
    <p class="text-[15px] font-semibold">
      {{ hasFilter ? 'Nenhuma transação encontrada' : 'Nenhum gasto ainda este mês' }}
    </p>
    <p class="text-[12.5px] text-muted-foreground mt-1 max-w-[260px] mx-auto leading-snug">
      {{ hasFilter ? 'Ajuste os filtros ou registre uma nova.' : 'Ótimo começo! Registre sua primeira transação.' }}
    </p>
    <button
      type="button"
      class="mt-4 inline-flex items-center gap-1.5 h-11 px-5 rounded-md bg-foreground text-background text-sm font-semibold active:scale-95 transition-transform"
      @click="emit('addNew')"
    >
      <Plus :size="16" /> Registrar agora
    </button>
  </div>

  <!-- Grouped list -->
  <div v-else :class="nested ? '' : 'rounded-md border border-border overflow-clip'">
    <template v-for="group in groups" :key="group.date">
      <!-- Date header — Lovable style: bg-card/95 backdrop-blur, no border-b -->
      <div class="sticky top-12 lg:top-0 z-10 bg-card/95 backdrop-blur px-4 pt-2.5 pb-1 flex items-center justify-between gap-2">
        <span class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {{ group.label }}
        </span>
        <span
          v-if="group.income !== 0 || group.expenses !== 0"
          class="text-[10px] tabular-nums"
          :class="group.income >= group.expenses ? 'text-success/70' : 'text-destructive/70'"
        >
          {{ group.income >= group.expenses ? '+' : '-' }}{{ formatCurrency(Math.abs(group.income - group.expenses)) }}
        </span>
      </div>

      <!-- Transactions -->
      <ul class="divide-y divide-border/60">
        <TransactionCard
          v-for="t in group.transactions"
          :key="t.id"
          :transaction="t"
          @select="emit('select', $event)"
        />
      </ul>
    </template>
  </div>
</template>
