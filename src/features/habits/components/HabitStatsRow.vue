<script setup lang="ts">
import { computed } from 'vue'
import { Flame } from 'lucide-vue-next'
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
    <div class="rounded-md border border-border bg-card p-3.5">
      <template v-if="loading">
        <Skeleton class="h-2.5 w-20 mb-3" />
        <Skeleton class="h-5 w-8" />
      </template>
      <template v-else>
        <p class="text-[11px] font-medium uppercase tracking-wider mb-1 text-muted-foreground">
          Hábitos ativos
        </p>
        <p class="text-lg font-semibold tabular-nums mt-1 text-foreground">
          {{ activeCount }}
        </p>
      </template>
    </div>

    <!-- Maior streak — amber tint -->
    <div
      class="rounded-md border border-border p-3.5 relative overflow-hidden"
      style="background: linear-gradient(135deg, hsl(var(--card)) 60%, hsl(40 65% 56% / 0.1) 100%)"
    >
      <template v-if="loading">
        <Skeleton class="h-2.5 w-20 mb-3" />
        <Skeleton class="h-5 w-16" />
      </template>
      <template v-else>
        <p class="text-[11px] font-medium uppercase tracking-wider mb-1 text-muted-foreground flex items-center gap-1.5">
          <Flame :size="14" class="text-warning" />
          Maior streak
        </p>
        <p class="text-lg font-semibold tabular-nums mt-1"
          style="color: hsl(var(--warning))">
          {{ longestStreak }} dias
        </p>
      </template>
    </div>

    <!-- Consistência semanal — with progress bar -->
    <div class="rounded-md border border-border bg-card p-3.5">
      <template v-if="loading">
        <Skeleton class="h-2.5 w-24 mb-3" />
        <Skeleton class="h-5 w-12" />
      </template>
      <template v-else>
        <p class="text-[11px] font-medium uppercase tracking-wider mb-1 text-muted-foreground">
          Consistência semanal
        </p>
        <p class="text-lg font-semibold tabular-nums mt-1 mb-2"
          :style="{ color: consistencyColor }">
          {{ weeklyConsistency }}%
        </p>
        <!-- Progress bar -->
        <div class="h-1 rounded-full overflow-hidden" style="background: hsl(var(--muted))">
          <div
            class="h-full rounded-full transition-all duration-700"
            :style="{ width: progressWidth, background: consistencyColor }"
          />
        </div>
      </template>
    </div>

    <!-- Concluídos hoje -->
    <div class="rounded-md border border-border bg-card p-3.5">
      <template v-if="loading">
        <Skeleton class="h-2.5 w-24 mb-3" />
        <Skeleton class="h-5 w-12" />
      </template>
      <template v-else>
        <p class="text-[11px] font-medium uppercase tracking-wider mb-1 text-muted-foreground">
          Concluídos hoje
        </p>
        <p class="text-lg font-semibold tabular-nums mt-1"
          :style="completedToday === totalActive && totalActive > 0 ? 'color: hsl(var(--success))' : 'color: hsl(var(--foreground))'">
          {{ completedToday }} / {{ totalActive }}
        </p>
      </template>
    </div>

  </div>
</template>
