<script setup lang="ts">
import type { CalendarEvent } from '@/types/calendar'

defineProps<{
  event: CalendarEvent
}>()

const COLOR_MAP: Record<string, string> = {
  violet: 'hsl(262 83% 58%)',
  blue: 'hsl(217 91% 60%)',
  green: 'hsl(142 71% 45%)',
  yellow: 'hsl(38 92% 50%)',
  red: 'hsl(0 63% 51%)',
  pink: 'hsl(330 81% 60%)',
  orange: 'hsl(24 95% 53%)',
  slate: 'hsl(215 16% 47%)',
}
</script>

<template>
  <div
    class="truncate text-[10.5px] font-medium rounded px-1.5 py-[1px] leading-[1.5] cursor-pointer transition-base"
    :style="{
      background: `${COLOR_MAP[event.color ?? 'violet'] ?? COLOR_MAP.violet}22`,
      color: COLOR_MAP[event.color ?? 'violet'] ?? COLOR_MAP.violet,
      borderLeft: `2px solid ${COLOR_MAP[event.color ?? 'violet'] ?? COLOR_MAP.violet}`,
    }"
  >
    {{ event.title }}
  </div>
</template>
