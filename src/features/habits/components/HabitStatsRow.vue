<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@ui/skeleton'

const props = defineProps<{
  activeCount: number
  longestStreak: number
  weeklyConsistency: number
  completedToday: number
  totalActive: number
  loading?: boolean
}>()

const progressWidth = computed(() => `${Math.min(100, props.weeklyConsistency)}%`)
const consistencyColor = computed(() =>
  props.weeklyConsistency >= 80
    ? 'hsl(var(--success))'
    : props.weeklyConsistency >= 50
      ? 'hsl(var(--warning))'
      : 'hsl(var(--destructive) / 0.8)',
)
</script>

<template>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

    <!-- Hábitos ativos -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-2.5 w-20 mb-3" />
        <Skeleton class="h-6 w-8" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2.5"
          style="color: hsl(var(--muted-foreground) / 0.4)">
          Hábitos ativos
        </p>
        <p class="text-[22px] font-semibold tabular-nums leading-none text-foreground">
          {{ activeCount }}
        </p>
      </template>
    </div>

    <!-- Maior streak — amber tint -->
    <div
      class="rounded-lg border border-border/50 px-4 py-3.5 relative overflow-hidden"
      style="background: linear-gradient(135deg, hsl(var(--card)) 60%, hsl(40 65% 56% / 0.06))"
    >
      <template v-if="loading">
        <Skeleton class="h-2.5 w-20 mb-3" />
        <Skeleton class="h-6 w-16" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2.5"
          style="color: hsl(var(--muted-foreground) / 0.4)">
          🔥 Maior streak
        </p>
        <p class="text-[22px] font-semibold tabular-nums leading-none"
          style="color: hsl(var(--warning))">
          {{ longestStreak }}
          <span class="text-[13px] font-normal" style="color: hsl(var(--muted-foreground) / 0.5)">dias</span>
        </p>
      </template>
    </div>

    <!-- Consistência semanal — with progress bar -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-2.5 w-24 mb-3" />
        <Skeleton class="h-6 w-12" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2.5"
          style="color: hsl(var(--muted-foreground) / 0.4)">
          Consistência semanal
        </p>
        <p class="text-[22px] font-semibold tabular-nums leading-none mb-2.5"
          :style="{ color: consistencyColor }">
          {{ weeklyConsistency }}%
        </p>
        <!-- Progress bar -->
        <div class="h-1 rounded-full overflow-hidden" style="background: hsl(var(--border) / 0.5)">
          <div
            class="h-full rounded-full transition-all duration-700"
            :style="{ width: progressWidth, background: consistencyColor }"
          />
        </div>
      </template>
    </div>

    <!-- Concluídos hoje -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-2.5 w-24 mb-3" />
        <Skeleton class="h-6 w-12" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2.5"
          style="color: hsl(var(--muted-foreground) / 0.4)">
          Concluídos hoje
        </p>
        <p class="text-[22px] font-semibold tabular-nums leading-none"
          :style="completedToday === totalActive && totalActive > 0 ? 'color: hsl(var(--success))' : 'color: hsl(var(--foreground))'">
          {{ completedToday }}
          <span class="text-[13px] font-normal" style="color: hsl(var(--muted-foreground) / 0.4)">/ {{ totalActive }}</span>
        </p>
      </template>
    </div>

  </div>
</template>
