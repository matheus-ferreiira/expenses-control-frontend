<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  pendingToday: number
  completedToday: number
  habitsCompleted: number
  habitsTotal: number
  bestStreak: number
  bestStreakHabitName?: string
  totalBalance: number
  monthExpenses: number
  monthIncome: number
  loading?: boolean
}>()

function taskSubtext(): string {
  if (props.loading) return ''
  const total = props.pendingToday + props.completedToday
  if (total === 0) return 'Nenhuma tarefa hoje'
  return `${props.completedToday}/${total} concluídas`
}

function balanceChange(): string {
  const net = props.monthIncome - props.monthExpenses
  const sign = net >= 0 ? '+' : ''
  return `${sign}${formatCurrency(net)} este mês`
}

function expenseRatio(): string {
  if (props.monthIncome === 0) return '—'
  const pct = Math.round((props.monthExpenses / props.monthIncome) * 100)
  return `${pct}% da receita`
}
</script>

<template>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-2">
    <!-- Tarefas hoje -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-7 w-12 mb-1.5" />
        <Skeleton class="h-3 w-24" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/50 mb-2.5 select-none">
          Tarefas hoje
        </p>
        <p class="text-2xl font-semibold text-foreground leading-none mb-1.5 tabular-nums">
          {{ pendingToday }}
        </p>
        <p class="text-xs text-muted-foreground/70">{{ taskSubtext() }}</p>
      </template>
    </div>

    <!-- Streak -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-7 w-12 mb-1.5" />
        <Skeleton class="h-3 w-24" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/50 mb-2.5 select-none">
          Maior streak
        </p>
        <p class="text-2xl font-semibold text-foreground leading-none mb-1.5 tabular-nums">
          {{ bestStreak }}<span class="text-sm font-normal text-muted-foreground ml-1">dias</span>
        </p>
        <p class="text-xs text-muted-foreground/70 truncate">
          {{ bestStreakHabitName ?? 'Sem hábitos ativos' }}
        </p>
      </template>
    </div>

    <!-- Saldo total -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-7 w-24 mb-1.5" />
        <Skeleton class="h-3 w-28" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/50 mb-2.5 select-none">
          Saldo total
        </p>
        <p
          class="text-2xl font-semibold leading-none mb-1.5 tabular-nums truncate"
          :class="totalBalance >= 0 ? 'text-foreground' : 'text-destructive'"
        >
          {{ formatCurrency(totalBalance) }}
        </p>
        <p class="text-xs text-muted-foreground/70">{{ balanceChange() }}</p>
      </template>
    </div>

    <!-- Gastos do mês -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-7 w-24 mb-1.5" />
        <Skeleton class="h-3 w-20" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/50 mb-2.5 select-none">
          Gastos do mês
        </p>
        <p class="text-2xl font-semibold text-foreground leading-none mb-1.5 tabular-nums truncate">
          {{ formatCurrency(monthExpenses) }}
        </p>
        <p class="text-xs text-muted-foreground/70">{{ expenseRatio() }}</p>
      </template>
    </div>
  </div>
</template>
