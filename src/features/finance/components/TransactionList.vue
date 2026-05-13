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
  <div v-if="loading" class="rounded-lg border border-border overflow-hidden divide-y divide-border/50">
    <div v-for="i in 3" :key="i">
      <!-- Date header skeleton -->
      <div class="flex items-center justify-between px-4 py-2 bg-muted/30">
        <Skeleton class="h-3 w-16" />
        <Skeleton class="h-3 w-20" />
      </div>
      <!-- Row skeletons -->
      <div v-for="j in 2" :key="j" class="flex items-center gap-3 px-4 py-3">
        <Skeleton class="h-7 w-7 rounded-full shrink-0" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-3.5 w-1/2" />
          <Skeleton class="h-3 w-1/4" />
        </div>
        <Skeleton class="h-4 w-20 shrink-0" />
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div
    v-else-if="transactions.length === 0"
    class="flex flex-col items-center justify-center py-16 text-center"
  >
    <div class="p-3 rounded-lg bg-muted mb-3">
      <ReceiptText :size="22" class="text-muted-foreground" />
    </div>
    <p class="text-sm font-medium text-foreground">Nenhuma transação</p>
    <p class="text-xs text-muted-foreground mt-0.5">
      Registre sua primeira transação para o mês.
    </p>
  </div>

  <!-- Grouped list -->
  <div v-else class="rounded-lg border border-border overflow-hidden">
    <template v-for="group in groups" :key="group.date">
      <!-- Date header -->
      <div class="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50 sticky top-0">
        <span class="text-xs font-semibold text-muted-foreground">
          {{ group.label }}
        </span>
        <span
          v-if="group.income !== 0 || group.expenses !== 0"
          :class="[
            'text-xs font-medium tabular-nums',
            transactionAmountClass(group.income >= group.expenses ? 'income' : 'expense'),
          ]"
        >
          {{ group.income >= group.expenses ? '+' : '-' }}{{ formatCurrency(Math.abs(group.income - group.expenses)) }}
        </span>
      </div>

      <!-- Transactions -->
      <div class="divide-y divide-border/40">
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
