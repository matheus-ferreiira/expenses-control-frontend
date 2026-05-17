<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { EmptyState } from '@/components/shared'
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
  <div v-if="loading" class="rounded-lg border border-border overflow-hidden divide-y divide-border">
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
  <EmptyState
    v-else-if="transactions.length === 0"
    :icon="ReceiptText"
    title="Nenhuma transação"
    description="Registre sua primeira transação para o mês."
  />

  <!-- Grouped list -->
  <div v-else class="rounded-md border border-border overflow-hidden">
    <template v-for="group in groups" :key="group.date">
      <!-- Date header -->
      <div class="sticky top-12 lg:top-0 z-10 flex items-center justify-between px-4 py-1.5 bg-muted/60 backdrop-blur border-b border-border">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
      <div class="divide-y divide-border">
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
