<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  income: number
  expenses: number
  totalBalance: number
  loading?: boolean
  /** Short label for the selected month, e.g. "maio 2026" or "abril 2026". Falls back to "este mês". */
  monthLabel?: string
}>()

const monthNet = computed(() => props.income - props.expenses)
const periodLabel = computed(() => props.monthLabel ?? 'este mês')
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
        <div class="flex items-center gap-1.5 mb-2">
          <Wallet :size="12" class="text-success/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Saldo total
          </p>
        </div>
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
        <div class="flex items-center gap-1.5 mb-2">
          <TrendingUp :size="12" class="text-success/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Receitas
          </p>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ formatCurrency(income) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">{{ periodLabel }}</p>
      </template>
    </div>

    <!-- Despesas do mês -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <TrendingDown :size="12" class="text-destructive/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Despesas
          </p>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ formatCurrency(expenses) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">{{ periodLabel }}</p>
      </template>
    </div>

    <!-- Fluxo do mês -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <ArrowLeftRight :size="12" class="text-muted-foreground/50 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Fluxo do mês
          </p>
        </div>
        <p :class="['text-xl font-semibold tabular-nums leading-none', monthNet >= 0 ? 'text-success' : 'text-destructive/80']">
          {{ monthNet >= 0 ? '+' : '' }}{{ formatCurrency(monthNet) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">receitas − despesas</p>
      </template>
    </div>

  </div>
</template>
