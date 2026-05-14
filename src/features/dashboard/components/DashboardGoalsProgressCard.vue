<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Target, ArrowRight } from 'lucide-vue-next'
import type { Goal } from '@/types/goals'
import { ROUTES } from '@/constants/routes'

const MAX_SHOWN = 4

const props = defineProps<{
  goals: Goal[]
  loading?: boolean
}>()

const router = useRouter()

const shown = computed(() => props.goals.slice(0, MAX_SHOWN))
const hasMore = computed(() => props.goals.length > MAX_SHOWN)

function pct(goal: Goal) {
  return Math.min(Math.round(goal.progress_percentage), 100)
}

function pctColor(goal: Goal) {
  const p = pct(goal)
  if (p >= 100) return 'hsl(var(--success))'
  if (goal.is_overdue) return 'hsl(var(--warning))'
  return 'hsl(var(--primary))'
}
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <div class="flex items-center gap-2">
        <Target :size="13" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Metas em Progresso</span>
      </div>
      <button
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-base"
        @click="router.push({ name: ROUTES.GOALS })"
      >
        Ver tudo <ArrowRight :size="10" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-3">
      <div v-for="i in 3" :key="i" class="space-y-1.5">
        <div class="flex justify-between">
          <Skeleton class="h-3 w-2/3" />
          <Skeleton class="h-3 w-8" />
        </div>
        <Skeleton class="h-1 w-full rounded-full" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="goals.length === 0" class="px-4 py-5 text-center">
      <p class="text-xs text-muted-foreground/50">Nenhuma meta ativa.</p>
    </div>

    <!-- Goals list -->
    <div v-else class="divide-y divide-border/40">
      <div
        v-for="goal in shown"
        :key="goal.id"
        class="px-4 py-2.5 hover:bg-accent/20 transition-base"
      >
        <div class="flex items-center justify-between mb-1.5">
          <p class="text-[13px] text-foreground/90 truncate flex-1 mr-2">{{ goal.title }}</p>
          <span
            class="text-[11px] font-semibold tabular-nums shrink-0"
            :style="{ color: pctColor(goal) }"
          >
            {{ pct(goal) }}%
          </span>
        </div>
        <div class="h-1 w-full rounded-full overflow-hidden" style="background: hsl(var(--border) / 0.8)">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: `${pct(goal)}%`, background: pctColor(goal) }"
          />
        </div>
      </div>

      <div v-if="hasMore" class="px-4 py-2.5 text-center">
        <button
          class="text-xs text-muted-foreground/60 hover:text-foreground transition-base"
          @click="router.push({ name: ROUTES.GOALS })"
        >
          + {{ goals.length - MAX_SHOWN }} mais
        </button>
      </div>
    </div>
  </div>
</template>
