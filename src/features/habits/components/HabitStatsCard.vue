<script setup lang="ts">
import { Flame, TrendingUp, Calendar, Target } from 'lucide-vue-next'
import { Skeleton } from '@ui/skeleton'
import type { HabitStats } from '@/types/habits'
import { getCompletionRateLabel } from '../utils/habitHelpers'

defineProps<{
  stats: HabitStats | null
  loading?: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Current streak -->
    <div class="rounded-lg border border-border bg-card p-3 space-y-1">
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <Flame :size="13" class="text-orange-400" />
        <span class="text-[11px] font-medium uppercase tracking-wide">Sequência atual</span>
      </div>
      <Skeleton v-if="loading" class="h-6 w-16" />
      <p v-else class="text-2xl font-bold text-foreground">
        {{ stats?.current_streak ?? 0 }}
        <span class="text-sm font-normal text-muted-foreground">dias</span>
      </p>
    </div>

    <!-- Best streak -->
    <div class="rounded-lg border border-border bg-card p-3 space-y-1">
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <TrendingUp :size="13" class="text-emerald-400" />
        <span class="text-[11px] font-medium uppercase tracking-wide">Recorde</span>
      </div>
      <Skeleton v-if="loading" class="h-6 w-16" />
      <p v-else class="text-2xl font-bold text-foreground">
        {{ stats?.longest_streak ?? 0 }}
        <span class="text-sm font-normal text-muted-foreground">dias</span>
      </p>
    </div>

    <!-- Weekly consistency -->
    <div class="rounded-lg border border-border bg-card p-3 space-y-1">
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <Calendar :size="13" class="text-blue-400" />
        <span class="text-[11px] font-medium uppercase tracking-wide">Esta semana</span>
      </div>
      <Skeleton v-if="loading" class="h-6 w-16" />
      <p v-else class="text-2xl font-bold text-foreground">
        {{ stats?.completed_this_week ?? 0 }}
        <span class="text-sm font-normal text-muted-foreground">vezes</span>
      </p>
    </div>

    <!-- Completion rate -->
    <div class="rounded-lg border border-border bg-card p-3 space-y-1">
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <Target :size="13" class="text-muted-foreground" />
        <span class="text-[11px] font-medium uppercase tracking-wide">Consistência</span>
      </div>
      <Skeleton v-if="loading" class="h-6 w-16" />
      <p v-else class="text-2xl font-bold text-foreground">
        {{ stats ? getCompletionRateLabel(stats.completion_rate_30d) : '—' }}
      </p>
    </div>
  </div>
</template>
