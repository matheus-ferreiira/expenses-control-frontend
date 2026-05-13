<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import { ClipboardList, CheckCircle2, Flame, Zap } from 'lucide-vue-next'

const props = defineProps<{
  pendingToday: number
  completedToday: number
  habitsCompleted: number
  habitsTotal: number
  bestStreak: number
  loading?: boolean
}>()

const cards = [
  {
    label: 'Tarefas pendentes',
    icon: ClipboardList,
    iconClass: 'text-blue-400',
    bgClass: 'bg-blue-400/10',
    getValue: () => props.pendingToday,
    getSubtext: () =>
      props.pendingToday === 0 ? 'Tudo em dia!' : `${props.pendingToday === 1 ? '1 tarefa' : `${props.pendingToday} tarefas`} para hoje`,
  },
  {
    label: 'Concluídas hoje',
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    bgClass: 'bg-emerald-400/10',
    getValue: () => props.completedToday,
    getSubtext: () => (props.completedToday === 0 ? '—' : 'Bom trabalho!'),
  },
  {
    label: 'Hábitos feitos',
    icon: Flame,
    iconClass: 'text-orange-400',
    bgClass: 'bg-orange-400/10',
    getValue: () => `${props.habitsCompleted}/${props.habitsTotal}`,
    getSubtext: () => {
      if (props.habitsTotal === 0) return 'Nenhum hábito ativo'
      const pct = Math.round((props.habitsCompleted / props.habitsTotal) * 100)
      return `${pct}% do dia`
    },
  },
  {
    label: 'Melhor streak',
    icon: Zap,
    iconClass: 'text-violet-400',
    bgClass: 'bg-violet-400/10',
    getValue: () => props.bestStreak,
    getSubtext: () => (props.bestStreak === 0 ? 'Comece hoje!' : props.bestStreak === 1 ? '1 dia' : `${props.bestStreak} dias`),
  },
]
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-lg border border-border bg-card p-4"
    >
      <template v-if="loading">
        <Skeleton class="h-8 w-8 rounded-lg mb-3" />
        <Skeleton class="h-6 w-16 mb-1.5" />
        <Skeleton class="h-3 w-24" />
      </template>
      <template v-else>
        <div :class="['inline-flex p-2 rounded-lg mb-3', card.bgClass]">
          <component :is="card.icon" :size="16" :class="card.iconClass" />
        </div>
        <p class="text-xl font-semibold text-foreground leading-none mb-1">
          {{ card.getValue() }}
        </p>
        <p class="text-xs text-muted-foreground">{{ card.label }}</p>
        <p class="text-xs text-muted-foreground/60 mt-0.5">{{ card.getSubtext() }}</p>
      </template>
    </div>
  </div>
</template>
