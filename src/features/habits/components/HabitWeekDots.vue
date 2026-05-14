<script setup lang="ts">
import type { Habit } from '@/types/habits'
import { getWeeklyDots } from '../utils/habitHelpers'
import { computed } from 'vue'

const props = defineProps<{
  habit: Habit
}>()

const dots = computed(() => getWeeklyDots(props.habit))
</script>

<template>
  <div class="flex items-center gap-[3px]">
    <div
      v-for="dot in dots"
      :key="dot.date"
      :class="[
        'h-[7px] w-[7px] rounded-full transition-base',
        dot.isFuture
          ? 'bg-border/20'
          : dot.isLogged
            ? 'opacity-90'
            : dot.isToday
              ? 'bg-border/50 ring-1 ring-border'
              : 'bg-border/30',
      ]"
      :style="dot.isLogged && !dot.isFuture && habit.color ? `background: ${habit.color}` : undefined"
      :title="dot.date"
    />
  </div>
</template>
