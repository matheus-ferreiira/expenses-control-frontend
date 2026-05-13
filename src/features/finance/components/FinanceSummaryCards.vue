<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  income: number
  expenses: number
  loading?: boolean
}>()

const balance = () => props.income - props.expenses

const cards = [
  {
    label: 'Receitas',
    icon: TrendingUp,
    iconClass: 'text-emerald-400',
    bgClass: 'bg-emerald-400/10',
    getValue: () => props.income,
    amountClass: () => 'text-emerald-400',
  },
  {
    label: 'Despesas',
    icon: TrendingDown,
    iconClass: 'text-red-400',
    bgClass: 'bg-red-400/10',
    getValue: () => props.expenses,
    amountClass: () => 'text-red-400',
  },
  {
    label: 'Saldo',
    icon: Wallet,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted/60',
    getValue: () => balance(),
    amountClass: () =>
      balance() >= 0 ? 'text-emerald-400' : 'text-red-400',
  },
]
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-lg border border-border bg-card p-4"
    >
      <template v-if="loading">
        <Skeleton class="h-8 w-8 rounded-lg mb-3" />
        <Skeleton class="h-5 w-28 mb-1.5" />
        <Skeleton class="h-3 w-16" />
      </template>
      <template v-else>
        <div :class="['inline-flex p-2 rounded-lg mb-3', card.bgClass]">
          <component :is="card.icon" :size="16" :class="card.iconClass" />
        </div>
        <p :class="['text-lg font-semibold tabular-nums leading-none mb-1', card.amountClass()]">
          {{ formatCurrency(Math.abs(card.getValue())) }}
        </p>
        <p class="text-xs text-muted-foreground">{{ card.label }}</p>
      </template>
    </div>
  </div>
</template>
