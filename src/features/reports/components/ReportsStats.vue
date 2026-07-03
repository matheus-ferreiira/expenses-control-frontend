<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { computed } from 'vue'
import { CheckSquare, Activity, DollarSign, PiggyBank } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import type { ReportPeriod } from '@/types/reports'
import { REPORT_PERIOD_LABELS } from '@/types/reports'

const props = defineProps<{
  tasksCompleted: number
  tasksCompletedDelta: number | null
  habitsLogged: number
  habitsLoggedDelta: number | null
  financeNet: number
  financeNetDelta: number | null
  monthIncome: number
  period: ReportPeriod
  loading?: boolean
}>()

const savingsRate = computed(() => {
  if (props.monthIncome <= 0) return null
  return Math.round((props.financeNet / props.monthIncome) * 100)
})
</script>

<template>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

    <!-- Tarefas concluídas -->
    <div class="rounded-lg bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center justify-between gap-1.5 mb-2">
          <div class="flex items-center gap-1.5">
            <CheckSquare :size="12" class="text-info shrink-0" />
            <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Tarefas concluídas
            </p>
          </div>
          <span
            v-if="tasksCompletedDelta !== null"
            :class="[
              'text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0',
              tasksCompletedDelta >= 0 ? 'bg-muted text-success' : 'bg-muted text-destructive',
            ]"
          >
            {{ tasksCompletedDelta >= 0 ? '+' : '' }}{{ tasksCompletedDelta }}%
          </span>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ tasksCompleted }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-1">
          nos últimos {{ REPORT_PERIOD_LABELS[period] }}
        </p>
      </template>
    </div>

    <!-- Consistência de hábitos -->
    <div class="rounded-lg bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center justify-between gap-1.5 mb-2">
          <div class="flex items-center gap-1.5">
            <Activity :size="12" class="text-orange-400/70 shrink-0" />
            <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Consistência hábitos
            </p>
          </div>
          <span
            v-if="habitsLoggedDelta !== null"
            :class="[
              'text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0',
              habitsLoggedDelta >= 0 ? 'bg-muted text-success' : 'bg-muted text-destructive',
            ]"
          >
            {{ habitsLoggedDelta >= 0 ? '+' : '' }}{{ habitsLoggedDelta }}%
          </span>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ habitsLogged }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-1">
          check-ins no período
        </p>
      </template>
    </div>

    <!-- Saldo líquido -->
    <div class="rounded-lg bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <div class="flex items-center justify-between gap-1.5 mb-2">
          <div class="flex items-center gap-1.5">
            <DollarSign :size="12" class="text-success shrink-0" />
            <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Saldo líquido
            </p>
          </div>
          <span
            v-if="financeNetDelta !== null"
            :class="[
              'text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0',
              financeNetDelta >= 0 ? 'bg-muted text-success' : 'bg-muted text-destructive',
            ]"
          >
            {{ financeNetDelta >= 0 ? '+' : '' }}{{ financeNetDelta }}%
          </span>
        </div>
        <p
          :class="[
            'text-xl font-semibold tabular-nums leading-none',
            financeNet >= 0 ? 'text-success' : 'text-destructive',
          ]"
        >
          {{ financeNet >= 0 ? '+' : '' }}{{ formatCurrency(financeNet) }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-1">receitas − despesas</p>
      </template>
    </div>

    <!-- Economia -->
    <div class="rounded-lg bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <PiggyBank :size="12" class="text-success shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Economia
          </p>
        </div>
        <p
          :class="[
            'text-xl font-semibold tabular-nums leading-none',
            financeNet >= 0 ? 'text-success' : 'text-destructive',
          ]"
        >
          {{ financeNet >= 0 ? '+' : '' }}{{ formatCurrency(financeNet) }}
        </p>
        <p class="text-[11px] text-muted-foreground mt-1">
          {{ savingsRate !== null ? `${savingsRate}% da receita` : 'sem receitas no período' }}
        </p>
      </template>
    </div>

  </div>
</template>
