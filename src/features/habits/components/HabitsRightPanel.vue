<script setup lang="ts">
import { computed } from 'vue'
import type { Habit } from '@/types/habits'
import { isCompletedToday } from '../utils/habitHelpers'

const props = defineProps<{
  habits: Habit[]
}>()

const activeHabits = computed(() => props.habits.filter((h) => h.is_active))
const completedToday = computed(() => activeHabits.value.filter((h) => isCompletedToday(h)).length)
const totalActive = computed(() => activeHabits.value.length)
const progressPercent = computed(() =>
  totalActive.value > 0 ? Math.round((completedToday.value / totalActive.value) * 100) : 0,
)

const topStreaks = computed(() =>
  [...activeHabits.value]
    .filter((h) => h.current_streak > 0)
    .sort((a, b) => b.current_streak - a.current_streak)
    .slice(0, 6),
)
</script>

<template>
  <div class="w-[188px] shrink-0 flex flex-col gap-5 pt-1">

    <!-- Today progress -->
    <div>
      <p class="text-[9px] font-semibold uppercase tracking-[0.12em] mb-2.5"
        style="color: hsl(var(--muted-foreground) / 0.4)">
        Hoje
      </p>

      <div class="flex items-baseline gap-1.5 mb-2">
        <span class="text-[22px] font-semibold leading-none tabular-nums"
          :style="completedToday === totalActive && totalActive > 0 ? 'color: hsl(var(--success))' : 'color: hsl(var(--foreground))'">
          {{ completedToday }}
        </span>
        <span class="text-[13px]" style="color: hsl(var(--muted-foreground) / 0.35)">
          / {{ totalActive }}
        </span>
      </div>

      <!-- Progress bar -->
      <div class="h-1 rounded-full overflow-hidden" style="background: hsl(var(--border) / 0.4)">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{
            width: `${progressPercent}%`,
            background: progressPercent === 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))',
          }"
        />
      </div>
      <p class="text-[11px] mt-1.5" style="color: hsl(var(--muted-foreground) / 0.35)">
        {{ progressPercent }}% concluído
      </p>
    </div>

    <!-- Divider -->
    <div class="border-t border-border/30" />

    <!-- Top streaks -->
    <div v-if="topStreaks.length > 0">
      <p class="text-[9px] font-semibold uppercase tracking-[0.12em] mb-2.5"
        style="color: hsl(var(--muted-foreground) / 0.4)">
        Top Streaks
      </p>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="habit in topStreaks"
          :key="habit.id"
          class="flex items-center gap-2"
        >
          <div
            class="h-1.5 w-1.5 rounded-full shrink-0"
            :style="{ background: habit.color }"
          />
          <span class="text-[12px] text-foreground/70 truncate flex-1">
            {{ habit.name }}
          </span>
          <span class="text-[11px] tabular-nums shrink-0"
            style="color: hsl(var(--warning) / 0.7)">
            🔥{{ habit.current_streak }}
          </span>
        </div>
      </div>
    </div>

    <!-- No streaks yet -->
    <div v-else>
      <p class="text-[9px] font-semibold uppercase tracking-[0.12em] mb-2"
        style="color: hsl(var(--muted-foreground) / 0.4)">
        Top Streaks
      </p>
      <p class="text-[11px]" style="color: hsl(var(--muted-foreground) / 0.3)">
        Nenhuma sequência ativa ainda.
      </p>
    </div>

  </div>
</template>
