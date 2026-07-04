<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Target, ArrowRight } from 'lucide-vue-next'
import type { FinanceGoal } from '@/types/finance'
import { ROUTES } from '@/constants/routes'

const MAX_SHOWN = 4

const props = defineProps<{
  goals: FinanceGoal[]
  loading?: boolean
}>()

const router = useRouter()

const shown = computed(() => props.goals.slice(0, MAX_SHOWN))
const hasMore = computed(() => props.goals.length > MAX_SHOWN)

function pct(goal: FinanceGoal) {
  return Math.min(Math.round(goal.progress_percentage), 100)
}

function isOverdue(goal: FinanceGoal) {
  return !!goal.deadline && new Date(goal.deadline) < new Date() && pct(goal) < 100
}

function pctColor(goal: FinanceGoal) {
  const p = pct(goal)
  if (p >= 100) return 'hsl(var(--success))'
  if (isOverdue(goal)) return 'hsl(var(--warning))'
  return 'hsl(var(--primary))'
}
</script>

<template>
  <div class="rounded-lg bg-card">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border">
      <div class="flex items-center gap-2">
        <Target :size="13" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Metas em Progresso</span>
      </div>
      <button
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-base"
        @click="router.push({ name: ROUTES.FINANCE_GOALS })"
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
      <p class="text-xs text-muted-foreground">Nenhuma meta ativa.</p>
    </div>

    <!-- Goals list -->
    <div v-else class="divide-y divide-border">
      <div
        v-for="goal in shown"
        :key="goal.id"
        class="px-4 py-2.5 hover:bg-muted transition-base"
      >
        <div class="flex items-center justify-between mb-1.5">
          <p class="text-[13px] text-foreground truncate flex-1 mr-2">{{ goal.name }}</p>
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
          class="text-xs text-muted-foreground hover:text-foreground transition-base"
          @click="router.push({ name: ROUTES.FINANCE_GOALS })"
        >
          + {{ goals.length - MAX_SHOWN }} mais
        </button>
      </div>
    </div>
  </div>
</template>
