<script setup lang="ts">
import { ref } from 'vue'
import type { CalendarDay, CalendarEvent } from '@/types/calendar'
import CalendarEventChip from './CalendarEventChip.vue'

const MAX_VISIBLE = 3

const props = defineProps<{
  day: CalendarDay
}>()

const emit = defineEmits<{
  clickDay: [day: CalendarDay]
  clickEvent: [event: CalendarEvent]
  dropEvent: [eventId: string, day: CalendarDay]
}>()

const isDragOver = ref(false)

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
}

function onDragLeave(e: DragEvent) {
  // Only clear if leaving the cell entirely (not a child element)
  if (!(e.currentTarget as HTMLElement)?.contains(e.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const eventId = e.dataTransfer?.getData('text/plain')
  if (eventId) emit('dropEvent', eventId, props.day)
}
</script>

<template>
  <div
    class="min-h-[90px] p-1.5 border-r border-b transition-base cursor-pointer select-none group"
    :style="[
      'border-color: hsl(var(--border) / 0.35)',
      !day.isCurrentMonth ? 'opacity: 0.3' : '',
      isDragOver ? 'background: hsl(var(--primary) / 0.06); border-color: hsl(var(--primary) / 0.4)' : '',
    ]"
    @click="emit('clickDay', day)"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Day number -->
    <div class="flex justify-end mb-1">
      <span
        class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-medium transition-base"
        :style="day.isToday
          ? 'background: hsl(var(--primary)); color: hsl(var(--primary-foreground))'
          : day.isWeekend && day.isCurrentMonth
            ? 'color: hsl(var(--muted-foreground) / 0.55)'
            : 'color: hsl(var(--foreground) / 0.7)'"
      >
        {{ day.date.getDate() }}
      </span>
    </div>

    <!-- Event chips -->
    <div class="space-y-[2px]">
      <CalendarEventChip
        v-for="event in day.events.slice(0, MAX_VISIBLE)"
        :key="event.id"
        :event="event"
        @click="emit('clickEvent', event)"
        @drag-start="() => {}"
      />
      <div
        v-if="day.events.length > MAX_VISIBLE"
        class="text-[10px] px-1 font-medium transition-base"
        style="color: hsl(var(--muted-foreground) / 0.5)"
        @click.stop="emit('clickDay', day)"
      >
        +{{ day.events.length - MAX_VISIBLE }} mais
      </div>
    </div>
  </div>
</template>
