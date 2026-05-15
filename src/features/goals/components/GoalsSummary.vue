<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { Target, Trophy, BarChart3, AlertCircle } from 'lucide-vue-next'

defineProps<{
  activeCount: number
  completedCount: number
  averageProgress: number
  overdueCount: number
  loading?: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

    <!-- Ativas -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <Target :size="12" class="text-info/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Ativas
          </p>
        </div>
        <p class="text-xl font-semibold tabular-nums leading-none text-foreground">
          {{ activeCount }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">em andamento</p>
      </template>
    </div>

    <!-- Concluídas -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <Trophy :size="12" class="text-success/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Concluídas
          </p>
        </div>
        <p :class="['text-xl font-semibold tabular-nums leading-none', completedCount > 0 ? 'text-success' : 'text-foreground']">
          {{ completedCount }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">metas alcançadas</p>
      </template>
    </div>

    <!-- Progresso médio -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-12" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <BarChart3 :size="12" class="text-warning/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Progresso médio
          </p>
        </div>
        <p :class="[
          'text-xl font-semibold tabular-nums leading-none',
          averageProgress >= 75 ? 'text-success' : averageProgress >= 40 ? 'text-warning' : 'text-foreground',
        ]">
          {{ averageProgress }}%
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">metas ativas</p>
      </template>
    </div>

    <!-- Atrasadas -->
    <div class="rounded-lg border border-border/50 bg-card px-4 py-3.5">
      <template v-if="loading">
        <Skeleton class="h-3 w-16 mb-3" />
        <Skeleton class="h-6 w-10" />
      </template>
      <template v-else>
        <div class="flex items-center gap-1.5 mb-2">
          <AlertCircle :size="12" class="text-warning/70 shrink-0" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Atrasadas
          </p>
        </div>
        <p :class="['text-xl font-semibold tabular-nums leading-none', overdueCount > 0 ? 'text-warning' : 'text-foreground']">
          {{ overdueCount }}
        </p>
        <p class="text-[11px] text-muted-foreground/40 mt-1">prazo vencido</p>
      </template>
    </div>

  </div>
</template>
