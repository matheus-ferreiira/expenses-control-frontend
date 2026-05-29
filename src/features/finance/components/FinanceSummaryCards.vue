<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'
import { CalendarClock } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  income: number
  expenses: number
  totalBalance: number
  projectedBalance?: number
  isCurrentMonth?: boolean
  loading?: boolean
  monthLabel?: string
  accountCount?: number
}>()

const monthNet = computed(() => props.income - props.expenses)
const periodLabel = computed(() => props.monthLabel ?? 'este mês')
const showProjected = computed(() => props.isCurrentMonth && props.projectedBalance !== undefined)
const budgetPctLabel = computed(() => {
  if (props.income <= 0) return periodLabel.value
  const pct = Math.min(100, Math.round((props.expenses / props.income) * 100))
  return `${pct}% do orçamento`
})
</script>

<template>
  <div class="hidden lg:grid grid-cols-2 lg:grid-cols-4 gap-3">

    <!-- Saldo total -->
    <div class="bg-card border border-border rounded-xl p-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-5 w-24" />
        <Skeleton class="h-2.5 w-20 mt-1.5" />
      </template>
      <template v-else>
        <p class="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Saldo total</p>
        <p :class="['text-lg font-semibold mt-1 tabular-nums', totalBalance < 0 ? 'text-destructive' : '']">
          {{ formatCurrency(totalBalance) }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-0.5">
          {{ accountCount != null ? `${accountCount} conta${accountCount !== 1 ? 's' : ''}` : 'contas ativas' }}
        </p>
        <template v-if="showProjected">
          <div class="mt-2 pt-2 border-t border-border/40">
            <div class="flex items-center gap-1 mb-1">
              <CalendarClock :size="10" class="text-muted-foreground/40 shrink-0" />
              <p class="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40">
                Previsto fim do mês
              </p>
            </div>
            <p :class="['text-sm font-semibold tabular-nums leading-none', projectedBalance! >= totalBalance ? 'text-success/80' : 'text-destructive/70']">
              {{ formatCurrency(projectedBalance!) }}
            </p>
          </div>
        </template>
      </template>
    </div>

    <!-- Receitas (mês) -->
    <div class="bg-card border border-border rounded-xl p-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-5 w-24" />
      </template>
      <template v-else>
        <p class="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Receitas (mês)</p>
        <p class="text-lg font-semibold mt-1 tabular-nums text-success">
          {{ formatCurrency(income) }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-0.5">{{ periodLabel }}</p>
      </template>
    </div>

    <!-- Despesas (mês) -->
    <div class="bg-card border border-border rounded-xl p-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-5 w-24" />
      </template>
      <template v-else>
        <p class="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Despesas (mês)</p>
        <p class="text-lg font-semibold mt-1 tabular-nums text-destructive">
          {{ formatCurrency(expenses) }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-0.5">{{ budgetPctLabel }}</p>
      </template>
    </div>

    <!-- Fluxo do mês -->
    <div class="bg-card border border-border rounded-xl p-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-5 w-24" />
      </template>
      <template v-else>
        <p class="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Fluxo do mês</p>
        <p :class="['text-lg font-semibold mt-1 tabular-nums', monthNet >= 0 ? 'text-success' : 'text-destructive']">
          {{ monthNet >= 0 ? '+' : '' }}{{ formatCurrency(monthNet) }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-0.5">receitas − despesas</p>
      </template>
    </div>

  </div>
</template>
