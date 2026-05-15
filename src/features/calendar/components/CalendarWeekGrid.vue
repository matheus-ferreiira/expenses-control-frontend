<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { CalendarEvent } from '@/types/calendar'
import { isToday } from '../utils/calendarHelpers'
import { useWeekPositioning } from '../composables/useEventPositioning'

const HOUR_HEIGHT = 64
const TOTAL_HEIGHT = HOUR_HEIGHT * 24

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const COLOR_MAP: Record<string, string> = {
  blue: 'hsl(217 91% 60%)',
  green: 'hsl(142 71% 45%)',
  yellow: 'hsl(38 92% 50%)',
  red: 'hsl(0 63% 51%)',
  pink: 'hsl(330 81% 60%)',
  orange: 'hsl(24 95% 53%)',
  slate: 'hsl(215 16% 47%)',
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const props = defineProps<{
  weekDays: Date[]
  events: CalendarEvent[]
  loading?: boolean
}>()

const emit = defineEmits<{
  clickEvent: [event: CalendarEvent]
  clickSlot: [date: Date, hour: number]
}>()

const scrollContainer = ref<HTMLElement | null>(null)

const weekDaysRef = computed(() => props.weekDays)
const eventsRef = computed(() => props.events)

const { positionedByDay } = useWeekPositioning(weekDaysRef, eventsRef)

function getCurrentTimePct(): number {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  return (mins / 1440) * 100
}

function getEventColor(color: string | null): string {
  return COLOR_MAP[color ?? 'blue'] ?? 'hsl(217 91% 60%)'
}

function handleSlotClick(day: Date, hour: number) {
  emit('clickSlot', day, hour)
}

onMounted(async () => {
  await nextTick()
  if (scrollContainer.value) {
    const now = new Date()
    const scrollToMins = Math.max(0, now.getHours() * 60 - 60)
    scrollContainer.value.scrollTop = (scrollToMins / 1440) * TOTAL_HEIGHT
  }
})
</script>

<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <!-- Day headers row (sticky) -->
    <div
      class="grid shrink-0 border-b"
      :style="{
        gridTemplateColumns: '56px repeat(7, 1fr)',
        borderColor: 'hsl(var(--border) / 0.4)',
      }"
    >
      <div class="border-r" :style="{ borderColor: 'hsl(var(--border) / 0.4)' }" />
      <div
        v-for="(day, i) in weekDays"
        :key="i"
        class="flex flex-col items-center justify-center py-2 border-r gap-0.5"
        :style="{ borderColor: 'hsl(var(--border) / 0.4)' }"
      >
        <span
          class="text-[10px] font-semibold uppercase tracking-[0.08em]"
          :style="isToday(day) ? 'color: hsl(var(--primary))' : 'color: hsl(var(--muted-foreground) / 0.5)'"
        >
          {{ WEEKDAY_SHORT[day.getDay()] }}
        </span>
        <span
          class="inline-flex items-center justify-center w-7 h-7 rounded-full text-[15px] font-semibold transition-base"
          :style="isToday(day)
            ? 'background: hsl(var(--primary)); color: hsl(var(--primary-foreground))'
            : 'color: hsl(var(--foreground) / 0.8)'"
        >
          {{ day.getDate() }}
        </span>
      </div>
    </div>

    <!-- All-day events row -->
    <div
      v-if="positionedByDay.some(d => d.allDay.length > 0)"
      class="grid shrink-0 border-b"
      :style="{
        gridTemplateColumns: '56px repeat(7, 1fr)',
        borderColor: 'hsl(var(--border) / 0.4)',
        minHeight: '32px',
      }"
    >
      <div
        class="flex items-center justify-end pr-2 border-r text-[10px] font-medium"
        :style="{ borderColor: 'hsl(var(--border) / 0.4)', color: 'hsl(var(--muted-foreground) / 0.4)' }"
      >
        dia todo
      </div>
      <div
        v-for="(dayData, i) in positionedByDay"
        :key="i"
        class="flex flex-col gap-[2px] px-1 py-1 border-r"
        :style="{ borderColor: 'hsl(var(--border) / 0.4)' }"
      >
        <div
          v-for="event in dayData.allDay"
          :key="event.id"
          class="text-[10.5px] font-medium px-1.5 py-[1px] rounded truncate cursor-pointer transition-base"
          :style="{
            background: getEventColor(event.color) + '22',
            borderLeft: `2px solid ${getEventColor(event.color)}`,
            color: getEventColor(event.color),
          }"
          @click="emit('clickEvent', event)"
        >
          {{ event.title }}
        </div>
      </div>
    </div>

    <!-- Scrollable time grid -->
    <div ref="scrollContainer" class="flex-1 overflow-y-auto overflow-x-hidden">
      <div
        class="grid relative"
        :style="{
          gridTemplateColumns: '56px repeat(7, 1fr)',
          height: `${TOTAL_HEIGHT}px`,
        }"
      >
        <!-- Hour labels column -->
        <div class="relative">
          <div
            v-for="hour in HOURS"
            :key="hour"
            class="absolute right-2 text-[10px] tabular-nums font-medium select-none"
            :style="{
              top: `${hour * HOUR_HEIGHT - 6}px`,
              color: 'hsl(var(--muted-foreground) / 0.35)',
            }"
          >
            {{ String(hour).padStart(2, '0') }}:00
          </div>
        </div>

        <!-- Day columns -->
        <div
          v-for="(dayData, dayIdx) in positionedByDay"
          :key="dayIdx"
          class="relative border-r"
          :style="{ borderColor: 'hsl(var(--border) / 0.4)' }"
        >
          <!-- Hour grid lines -->
          <div
            v-for="hour in HOURS"
            :key="hour"
            class="absolute w-full border-t cursor-pointer transition-base"
            :style="{
              top: `${hour * HOUR_HEIGHT}px`,
              height: `${HOUR_HEIGHT}px`,
              borderColor: 'hsl(var(--border) / 0.2)',
            }"
            @click="handleSlotClick(dayData.day, hour)"
          />

          <!-- Current time indicator -->
          <div
            v-if="isToday(dayData.day)"
            class="absolute w-full z-20 flex items-center pointer-events-none"
            :style="{ top: `${getCurrentTimePct()}%` }"
          >
            <div
              class="w-2 h-2 rounded-full shrink-0 -ml-1"
              style="background: hsl(0 63% 51%)"
            />
            <div
              class="flex-1 h-[1.5px]"
              style="background: hsl(0 63% 51%)"
            />
          </div>

          <!-- Positioned events -->
          <div
            v-for="pos in dayData.positioned"
            :key="pos.event.id"
            class="absolute z-10 rounded overflow-hidden cursor-pointer transition-base px-1.5 py-0.5"
            :style="{
              top: `${pos.topPct}%`,
              height: `${pos.heightPct}%`,
              left: `${pos.leftPct}%`,
              width: `calc(${pos.widthPct}% - 2px)`,
              background: getEventColor(pos.event.color) + '22',
              borderLeft: `2px solid ${getEventColor(pos.event.color)}`,
            }"
            @click.stop="emit('clickEvent', pos.event)"
          >
            <p
              class="text-[10.5px] font-semibold leading-snug truncate"
              :style="{ color: getEventColor(pos.event.color) }"
            >
              {{ pos.event.title }}
            </p>
            <p
              class="text-[9.5px] leading-snug truncate"
              :style="{ color: getEventColor(pos.event.color) + 'bb' }"
            >
              {{ new Date(pos.event.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
