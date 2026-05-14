<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { formatCurrency } from '@/utils/currency'
import type { ReportPeriod } from '@/types/reports'
import { REPORT_PERIOD_LABELS } from '@/types/reports'

interface BestStreak {
  streak: number
  name: string
}

interface MostConsistentHabit {
  count: number
  name: string
  color: string
}

interface TopExpenseCategory {
  name: string
  total: number
}

defineProps<{
  bestStreak: BestStreak | null
  mostConsistentHabit: MostConsistentHabit | null
  topExpenseCategory: TopExpenseCategory | null
  tasksCompleted: number
  activeGoals: number
  period: ReportPeriod
  loading?: boolean
}>()
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <div class="px-4 py-3 border-b border-border/50">
      <span class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
        Destaques — últimos {{ REPORT_PERIOD_LABELS[period] }}
      </span>
    </div>

    <div v-if="loading" class="px-4 py-4 space-y-2.5">
      <Skeleton v-for="i in 5" :key="i" class="h-5 w-full rounded" />
    </div>

    <ul v-else class="divide-y divide-border/25">

      <!-- Tasks completed -->
      <li class="flex items-center justify-between px-4 py-3">
        <span class="text-[12px] text-muted-foreground/60">Tarefas concluídas</span>
        <span class="text-[13px] font-semibold tabular-nums" :class="tasksCompleted > 0 ? 'text-foreground' : 'text-muted-foreground/40'">
          {{ tasksCompleted }}
        </span>
      </li>

      <!-- Active goals -->
      <li class="flex items-center justify-between px-4 py-3">
        <span class="text-[12px] text-muted-foreground/60">Metas ativas</span>
        <span class="text-[13px] font-semibold tabular-nums" :class="activeGoals > 0 ? 'text-foreground' : 'text-muted-foreground/40'">
          {{ activeGoals }}
        </span>
      </li>

      <!-- Best streak -->
      <li class="flex items-center justify-between px-4 py-3">
        <span class="text-[12px] text-muted-foreground/60">Maior sequência de hábito</span>
        <span v-if="bestStreak" class="text-[13px] font-semibold tabular-nums text-foreground">
          {{ bestStreak.streak }}d · <span class="font-normal text-muted-foreground/70">{{ bestStreak.name }}</span>
        </span>
        <span v-else class="text-[12px] text-muted-foreground/30">—</span>
      </li>

      <!-- Most consistent habit -->
      <li class="flex items-center justify-between px-4 py-3">
        <span class="text-[12px] text-muted-foreground/60">Hábito mais consistente</span>
        <span v-if="mostConsistentHabit" class="text-[13px] font-semibold tabular-nums text-foreground">
          {{ mostConsistentHabit.count }}x · <span class="font-normal text-muted-foreground/70">{{ mostConsistentHabit.name }}</span>
        </span>
        <span v-else class="text-[12px] text-muted-foreground/30">—</span>
      </li>

      <!-- Top expense category -->
      <li class="flex items-center justify-between px-4 py-3">
        <span class="text-[12px] text-muted-foreground/60">Maior categoria de despesa</span>
        <span v-if="topExpenseCategory" class="text-[13px] font-semibold tabular-nums text-foreground">
          {{ formatCurrency(topExpenseCategory.total) }} · <span class="font-normal text-muted-foreground/70">{{ topExpenseCategory.name }}</span>
        </span>
        <span v-else class="text-[12px] text-muted-foreground/30">—</span>
      </li>

    </ul>
  </div>
</template>
