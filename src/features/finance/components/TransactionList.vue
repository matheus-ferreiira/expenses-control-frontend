<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { ReceiptText } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { groupTransactionsByDate, transactionAmountClass } from '../utils/financeHelpers'
import TransactionCard from './TransactionCard.vue'

const props = defineProps<{
  transactions: Transaction[]
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [id: string]
}>()

const groups = computed(() => groupTransactionsByDate(props.transactions))
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="rounded-lg border border-border/50 overflow-hidden divide-y divide-border/40">
    <div v-for="i in 3" :key="i">
      <div class="flex items-center justify-between px-4 py-2 bg-muted/20">
        <Skeleton class="h-2.5 w-14" />
        <Skeleton class="h-2.5 w-16" />
      </div>
      <div v-for="j in 2" :key="j" class="flex items-center gap-3 px-4 py-2.5">
        <Skeleton class="h-2 w-2 rounded-full shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3 w-1/2" />
          <Skeleton class="h-2.5 w-1/4" />
        </div>
        <Skeleton class="h-3.5 w-20 shrink-0" />
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div
    v-else-if="transactions.length === 0"
    class="flex flex-col items-center justify-center py-14 text-center"
  >
    <div class="p-2.5 rounded-lg bg-muted/50 mb-3">
      <ReceiptText :size="18" class="text-muted-foreground/50" />
    </div>
    <p class="text-[13px] font-medium text-foreground/70">Nenhuma transação</p>
    <p class="text-[12px] text-muted-foreground/40 mt-0.5">
      Registre sua primeira transação para o mês.
    </p>
  </div>

  <!-- Grouped list -->
  <div v-else class="rounded-lg border border-border/50 overflow-hidden">
    <template v-for="group in groups" :key="group.date">
      <!-- Date header -->
      <div class="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40 sticky top-0">
        <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
          {{ group.label }}
        </span>
        <span
          v-if="group.income !== 0 || group.expenses !== 0"
          :class="[
            'text-[11px] tabular-nums',
            transactionAmountClass(group.income >= group.expenses ? 'income' : 'expense'),
          ]"
        >
          {{ group.income >= group.expenses ? '+' : '-' }}{{ formatCurrency(Math.abs(group.income - group.expenses)) }}
        </span>
      </div>

      <!-- Transactions -->
      <div class="divide-y divide-border/30">
        <TransactionCard
          v-for="t in group.transactions"
          :key="t.id"
          :transaction="t"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </template>
  </div>
</template>
