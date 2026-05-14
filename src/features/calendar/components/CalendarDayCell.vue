<script setup lang="ts">
import type { CalendarDay } from '@/types/calendar'

defineProps<{
  day: CalendarDay
}>()

const emit = defineEmits<{
  clickDay: [day: CalendarDay]
}>()
</script>

<template>
  <div
    class="min-h-[90px] p-1.5 border-r border-b transition-base cursor-pointer select-none"
    :style="[
      'border-color: hsl(var(--border) / 0.35)',
      day.isCurrentMonth ? '' : 'opacity: 0.35',
    ]"
    @click="emit('clickDay', day)"
  >
    <!-- Day number -->
    <div class="flex justify-end mb-1">
      <span
        class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-medium transition-base"
        :style="day.isToday
          ? 'background: hsl(var(--primary)); color: hsl(var(--primary-foreground))'
          : day.isWeekend && day.isCurrentMonth
            ? 'color: hsl(var(--muted-foreground) / 0.6)'
            : 'color: hsl(var(--foreground) / 0.75)'"
      >
        {{ day.date.getDate() }}
      </span>
    </div>

    <!-- Event chips slot — filled in Sprint 4 -->
    <div class="space-y-0.5">
      <slot />
    </div>
  </div>
</template>
