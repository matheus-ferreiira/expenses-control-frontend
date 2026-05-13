<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  income: number
  expenses: number
  totalBalance: number
  loading?: boolean
}>()

const monthNet = computed(() => props.income - props.expenses)
</script>

<template>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

    <!-- Saldo total -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Saldo total
        </p>
        <p :class="['text-xl font-semibold tabular-nums leading-none', totalBalance < 0 ? 'text-destructive/80' : 'text-foreground']">
          {{ formatCurrency(totalBalance) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">em contas ativas</p>
      </template>
    </div>

    <!-- Receitas do mês -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Receitas
        </p>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ formatCurrency(income) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">este mês</p>
      </template>
    </div>

    <!-- Despesas do mês -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Despesas
        </p>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ formatCurrency(expenses) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">este mês</p>
      </template>
    </div>

    <!-- Fluxo do mês -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Fluxo do mês
        </p>
        <p :class="['text-xl font-semibold tabular-nums leading-none', monthNet >= 0 ? 'text-success' : 'text-destructive/80']">
          {{ monthNet >= 0 ? '+' : '' }}{{ formatCurrency(monthNet) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">receitas − despesas</p>
      </template>
    </div>

  </div>
</template>
