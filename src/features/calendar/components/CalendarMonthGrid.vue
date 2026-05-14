<script setup lang="ts">
import { Skeleton } from '@ui/skeleton'
import type { CalendarDay, CalendarEvent, CalendarWeek } from '@/types/calendar'
import CalendarDayCell from './CalendarDayCell.vue'

defineProps<{
  weeks: CalendarWeek[]
  loading?: boolean
}>()

const emit = defineEmits<{
  clickDay: [day: CalendarDay]
  clickEvent: [event: CalendarEvent]
  dropEvent: [eventId: string, day: CalendarDay]
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

    <!-- Loading skeleton overlay -->
    <div v-if="loading" class="flex-1 p-4 grid grid-cols-7 gap-1">
      <Skeleton v-for="i in 35" :key="i" class="h-[80px] rounded-md" />
    </div>

    <!-- Grid rows -->
    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="(week, wi) in weeks"
        :key="wi"
        class="grid grid-cols-7"
      >
        <CalendarDayCell
          v-for="(day, di) in week"
          :key="`${wi}-${di}`"
          :day="day"
          :class="di === 6 ? 'border-r-0' : ''"
          :style="wi === weeks.length - 1 ? 'border-bottom: none' : ''"
          @click-day="emit('clickDay', $event)"
          @click-event="emit('clickEvent', $event)"
          @drop-event="(id, d) => emit('dropEvent', id, d)"
        />
      </div>
    </div>
  </div>
</template>
