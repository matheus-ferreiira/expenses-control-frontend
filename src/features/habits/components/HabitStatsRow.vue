<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'

defineProps<{
  activeCount: number
  longestStreak: number
  weeklyConsistency: number
  completedToday: number
  totalActive: number
  loading?: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

    <!-- Hábitos ativos -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-12" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Hábitos ativos
        </p>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ activeCount }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">
          {{ activeCount === 1 ? 'hábito' : 'hábitos' }} em acompanhamento
        </p>
      </template>
    </div>

    <!-- Maior streak -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-12" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Maior streak
        </p>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ longestStreak }}
          <span class="text-sm font-normal text-muted-foreground/50">dias</span>
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">sequência atual máxima</p>
      </template>
    </div>

    <!-- Consistência semanal -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-12" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Consistência semanal
        </p>
        <p :class="[
          'text-xl font-semibold tabular-nums leading-none',
          weeklyConsistency >= 80 ? 'text-success' : weeklyConsistency >= 50 ? 'text-warning' : 'text-foreground'
        ]">
          {{ weeklyConsistency }}%
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">dos hábitos esta semana</p>
      </template>
    </div>

    <!-- Concluídos hoje -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-12" />
      </template>
      <template v-else>
        <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">
          Concluídos hoje
        </p>
        <p :class="[
          'text-xl font-semibold tabular-nums leading-none',
          completedToday === totalActive && totalActive > 0 ? 'text-success' : 'text-foreground'
        ]">
          {{ completedToday }}
          <span class="text-sm font-normal text-muted-foreground/50">/ {{ totalActive }}</span>
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">hábitos marcados hoje</p>
      </template>
    </div>

  </div>
</template>
