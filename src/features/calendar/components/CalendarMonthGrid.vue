<script setup lang="ts">
import type { CalendarDay, CalendarWeek } from '@/types/calendar'
import CalendarDayCell from './CalendarDayCell.vue'

defineProps<{
  weeks: CalendarWeek[]
}>()

const emit = defineEmits<{
  clickDay: [day: CalendarDay]
}>()

const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Weekday headers -->
    <div class="grid grid-cols-7 border-b shrink-0" style="border-color: hsl(var(--border) / 0.4)">
      <div
        v-for="day in WEEKDAY_HEADERS"
        :key="day"
        class="py-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] select-none"
        style="color: hsl(var(--muted-foreground) / 0.4)"
      >
        {{ day }}
      </div>
    </div>

    <!-- Grid rows -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="(week, wi) in weeks"
        :key="wi"
        class="grid grid-cols-7"
        :class="wi === weeks.length - 1 ? '' : ''"
      >
        <CalendarDayCell
          v-for="(day, di) in week"
          :key="`${wi}-${di}`"
          :day="day"
          :class="di === 6 ? 'border-r-0' : ''"
          :style="wi === weeks.length - 1 ? 'border-bottom: none' : ''"
          @click-day="emit('clickDay', $event)"
        >
          <!-- Events rendered in Sprint 4 -->
        </CalendarDayCell>
      </div>
    </div>
  </div>
</template>
