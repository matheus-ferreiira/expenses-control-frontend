<script setup lang="ts">
import type { CalendarEvent } from '@/types/calendar'

const props = defineProps<{
  event: CalendarEvent
}>()

const emit = defineEmits<{
  click: []
  dragStart: [eventId: string]
}>()

const COLOR_MAP: Record<string, string> = {
  blue: 'hsl(217 91% 60%)',
  green: 'hsl(142 71% 45%)',
  yellow: 'hsl(38 92% 50%)',
  red: 'hsl(0 63% 51%)',
  pink: 'hsl(330 81% 60%)',
  orange: 'hsl(24 95% 53%)',
  slate: 'hsl(215 16% 47%)',
}

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', props.event.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  emit('dragStart', props.event.id)
}
</script>

<template>
  <div
    draggable="true"
    class="truncate text-[10.5px] font-medium rounded px-1.5 py-[1px] leading-[1.5] cursor-grab active:cursor-grabbing transition-base select-none"
    :style="{
      background: `${COLOR_MAP[event.color ?? 'blue'] ?? COLOR_MAP.blue}22`,
      color: COLOR_MAP[event.color ?? 'blue'] ?? COLOR_MAP.blue,
      borderLeft: `2px solid ${COLOR_MAP[event.color ?? 'blue'] ?? COLOR_MAP.blue}`,
    }"
    @click.stop="emit('click')"
    @dragstart.stop="onDragStart"
  >
    {{ event.title }}
  </div>
</template>
