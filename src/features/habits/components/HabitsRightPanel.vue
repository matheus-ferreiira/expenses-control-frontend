<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Heart, Brain, BookOpen, Target, Wallet } from 'lucide-vue-next'
import type { Habit } from '@/types/habits'

const props = defineProps<{
  habits: Habit[]
}>()

const activeHabits = computed(() => props.habits.filter((h) => h.is_active))

// Category config matching Lovable exactly
const CATEGORY_CONFIG = [
  { key: 'Saúde',      icon: Heart,    color: 'hsl(var(--destructive))',     bg: 'hsl(var(--destructive) / 0.12)',  border: 'hsl(var(--destructive) / 0.3)' },
  { key: 'Mente',      icon: Brain,    color: 'hsl(217 91% 68%)',            bg: 'hsl(217 91% 60% / 0.12)',         border: 'hsl(217 91% 60% / 0.3)' },
  { key: 'Aprendizado',icon: BookOpen, color: 'hsl(var(--chart-1, 220 70% 60%))', bg: 'hsl(var(--chart-1, 220 70% 60%) / 0.12)', border: 'hsl(var(--chart-1, 220 70% 60%) / 0.3)' },
  { key: 'Foco',       icon: Target,   color: 'hsl(var(--warning))',         bg: 'hsl(var(--warning) / 0.12)',      border: 'hsl(var(--warning) / 0.3)' },
  { key: 'Finanças',   icon: Wallet,   color: 'hsl(var(--success))',         bg: 'hsl(var(--success) / 0.12)',      border: 'hsl(var(--success) / 0.3)' },
]

const categoryItems = computed(() =>
  CATEGORY_CONFIG.map((c) => ({
    ...c,
    count: activeHabits.value.filter((h) => h.category === c.key).length,
  })).filter((c) => c.count > 0),
)

// Fallback: show uncategorized count if any
const uncategorizedCount = computed(() =>
  activeHabits.value.filter((h) => !h.category).length,
)

const topStreaks = computed(() =>
  [...activeHabits.value]
    .filter((h) => h.longest_streak > 0 || h.current_streak > 0)
    .sort((a, b) => Math.max(b.longest_streak, b.current_streak) - Math.max(a.longest_streak, a.current_streak))
    .slice(0, 4),
)
</script>

<template>
  <div class="w-[256px] shrink-0 flex flex-col gap-5 pt-1">

    <!-- Categorias panel -->
    <section class="bg-card border border-border rounded-md overflow-hidden">
      <header class="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 class="text-sm font-semibold text-foreground">Categorias</h2>
      </header>
      <ul class="divide-y divide-border">
        <li
          v-for="item in categoryItems"
          :key="item.key"
          class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 cursor-pointer transition-colors"
        >
          <span
            class="size-7 rounded-md grid place-items-center shrink-0"
            :style="{ background: item.bg }"
          >
            <component :is="item.icon" :size="14" :style="{ color: item.color }" />
          </span>
          <span class="flex-1 text-sm text-foreground">{{ item.key }}</span>
          <span
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
            :style="{ background: item.bg, borderColor: item.border, color: item.color }"
          >
            {{ item.count }}
          </span>
        </li>
        <!-- Sem categoria fallback -->
        <li
          v-if="uncategorizedCount > 0"
          class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 cursor-pointer transition-colors"
        >
          <span class="size-7 rounded-md grid place-items-center shrink-0 bg-muted">
            <Target :size="14" class="text-muted-foreground" />
          </span>
          <span class="flex-1 text-sm text-foreground">Outros</span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-border bg-muted text-muted-foreground">
            {{ uncategorizedCount }}
          </span>
        </li>
        <!-- Empty state -->
        <li v-if="categoryItems.length === 0 && uncategorizedCount === 0" class="px-4 py-4 text-[12px] text-muted-foreground/50">
          Nenhum hábito ativo.
        </li>
      </ul>
    </section>

    <!-- Top streaks panel -->
    <section class="bg-card border border-border rounded-md overflow-hidden">
      <header class="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 class="text-sm font-semibold text-foreground">Top streaks</h2>
      </header>
      <ul class="divide-y divide-border">
        <li
          v-for="(habit, idx) in topStreaks"
          :key="habit.id"
          class="flex items-center gap-3 px-4 py-2.5"
        >
          <span class="text-sm font-mono tabular-nums w-5 text-muted-foreground shrink-0">
            {{ idx + 1 }}
          </span>
          <span class="flex-1 text-sm text-foreground truncate">{{ habit.name }}</span>
          <span class="inline-flex items-center gap-1 text-sm tabular-nums shrink-0" style="color: hsl(var(--warning))">
            <Flame :size="12" />{{ Math.max(habit.longest_streak, habit.current_streak) }}
          </span>
        </li>
        <li v-if="topStreaks.length === 0" class="px-4 py-4 text-[12px] text-muted-foreground/50">
          Nenhuma sequência ativa ainda.
        </li>
      </ul>
    </section>

  </div>
</template>
