<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Calendar, CalendarDays } from 'lucide-vue-next'
import type { Habit } from '@/types/habits'

const props = defineProps<{
  habits: Habit[]
}>()

const activeHabits = computed(() => props.habits.filter((h) => h.is_active))

const topStreaks = computed(() =>
  [...activeHabits.value]
    .filter((h) => h.longest_streak > 0 || h.current_streak > 0)
    .sort((a, b) => Math.max(b.longest_streak, b.current_streak) - Math.max(a.longest_streak, a.current_streak))
    .slice(0, 5),
)

// Frequency breakdown with Lovable-style colors
const FREQ_CONFIG = [
  {
    key: 'daily',
    label: 'Diário',
    icon: Flame,
    bg: 'hsl(217 91% 60% / 0.12)',
    color: 'hsl(217 91% 68%)',
    border: 'hsl(217 91% 60% / 0.25)',
    badgeBg: 'hsl(217 91% 60% / 0.18)',
    badgeText: 'hsl(217 91% 72%)',
  },
  {
    key: 'weekly',
    label: 'Semanal',
    icon: CalendarDays,
    bg: 'hsl(40 65% 56% / 0.12)',
    color: 'hsl(40 80% 62%)',
    border: 'hsl(40 65% 56% / 0.25)',
    badgeBg: 'hsl(40 65% 56% / 0.18)',
    badgeText: 'hsl(40 80% 68%)',
  },
  {
    key: 'monthly',
    label: 'Mensal',
    icon: Calendar,
    bg: 'hsl(142 45% 46% / 0.12)',
    color: 'hsl(142 55% 52%)',
    border: 'hsl(142 45% 46% / 0.25)',
    badgeBg: 'hsl(142 45% 46% / 0.18)',
    badgeText: 'hsl(142 55% 58%)',
  },
]

const frequencyItems = computed(() =>
  FREQ_CONFIG.map((c) => ({
    ...c,
    count: activeHabits.value.filter((h) => h.frequency === c.key).length,
  })).filter((c) => c.count > 0),
)
</script>

<template>
  <div class="w-[200px] shrink-0 flex flex-col gap-5 pt-1">

    <!-- Frequências (Lovable-style "Categorias") -->
    <div v-if="frequencyItems.length > 0">
      <p class="text-[9.5px] font-semibold uppercase tracking-[0.12em] mb-3"
        style="color: hsl(var(--muted-foreground) / 0.38)">
        Frequências
      </p>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="item in frequencyItems"
          :key="item.key"
          class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border"
          :style="{ background: item.bg, borderColor: item.border }"
        >
          <div
            class="flex items-center justify-center h-6 w-6 rounded-md shrink-0"
            :style="{ background: item.badgeBg }"
          >
            <component :is="item.icon" :size="13" :style="{ color: item.color }" />
          </div>
          <span class="flex-1 text-[12.5px] font-medium truncate" :style="{ color: item.color }">
            {{ item.label }}
          </span>
          <span
            class="text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md shrink-0"
            :style="{ background: item.badgeBg, color: item.badgeText }"
          >
            {{ item.count }}
          </span>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div v-if="frequencyItems.length > 0" class="border-t border-border/30" />

    <!-- Top streaks -->
    <div v-if="topStreaks.length > 0">
      <p class="text-[9.5px] font-semibold uppercase tracking-[0.12em] mb-3"
        style="color: hsl(var(--muted-foreground) / 0.38)">
        Top streaks
      </p>
      <div class="flex flex-col gap-2">
        <div
          v-for="(habit, idx) in topStreaks"
          :key="habit.id"
          class="flex items-center gap-2"
        >
          <span
            class="text-[10px] tabular-nums w-3.5 shrink-0 text-center font-semibold"
            style="color: hsl(var(--muted-foreground) / 0.3)"
          >
            {{ idx + 1 }}
          </span>
          <div
            class="h-2 w-2 rounded-full shrink-0"
            :style="{ background: habit.color ?? 'hsl(var(--muted-foreground) / 0.4)' }"
          />
          <span class="text-[12.5px] text-foreground/70 truncate flex-1">
            {{ habit.name }}
          </span>
          <span
            class="text-[11px] tabular-nums shrink-0 flex items-center gap-0.5"
            style="color: hsl(var(--warning) / 0.8)"
          >
            <Flame :size="10" class="shrink-0" />{{ Math.max(habit.longest_streak, habit.current_streak) }}
          </span>
        </div>
      </div>
    </div>

    <!-- No streaks empty state -->
    <div v-if="topStreaks.length === 0">
      <p class="text-[9.5px] font-semibold uppercase tracking-[0.12em] mb-2"
        style="color: hsl(var(--muted-foreground) / 0.38)">
        Top streaks
      </p>
      <p class="text-[11px]" style="color: hsl(var(--muted-foreground) / 0.3)">
        Nenhuma sequência ativa ainda.
      </p>
    </div>

  </div>
</template>
