<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { CheckSquare, Activity, DollarSign, Target } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import type { ReportPeriod } from '@/types/reports'
import { REPORT_PERIOD_LABELS } from '@/types/reports'

defineProps<{
  tasksCompleted: number
  habitsLogged: number
  financeNet: number
  activeGoals: number
  period: ReportPeriod
  loading?: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

    <!-- Tarefas concluídas -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <CheckSquare :size="12" class="text-info/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Tarefas concluídas
          </p>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ tasksCompleted }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">
          nos últimos {{ REPORT_PERIOD_LABELS[period] }}
        </p>
      </template>
    </div>

    <!-- Hábitos completados -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <Activity :size="12" class="text-orange-400/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Registros de hábito
          </p>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ habitsLogged }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">
          check-ins no período
        </p>
      </template>
    </div>

    <!-- Saldo líquido -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-24" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <DollarSign :size="12" class="text-success/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Saldo líquido
          </p>
        </div>
        <p
          :class="[
            'text-xl font-semibold tabular-nums leading-none',
            financeNet >= 0 ? 'text-success' : 'text-destructive/80',
          ]"
        >
          {{ financeNet >= 0 ? '+' : '' }}{{ formatCurrency(financeNet) }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">receitas − despesas</p>
      </template>
    </div>

    <!-- Metas ativas -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <Target :size="12" class="text-info/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Metas ativas
          </p>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ activeGoals }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">em andamento</p>
      </template>
    </div>

  </div>
</template>
