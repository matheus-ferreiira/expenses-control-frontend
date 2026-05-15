<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays } from 'lucide-vue-next'
import { EmptyState } from '@/components/shared'
import type { CalendarEvent } from '@/types/calendar'
import { isSameDay, isToday } from '../utils/calendarHelpers'

const props = defineProps<{
  events: CalendarEvent[]
}>()

const emit = defineEmits<{
  clickEvent: [event: CalendarEvent]
  create: []
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

interface DayGroup {
  date: Date
  label: string
  isToday: boolean
  events: CalendarEvent[]
}

const grouped = computed<DayGroup[]>(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Future + today events, sorted by start
  const upcoming = props.events
    .filter((e) => new Date(e.end_date) >= now)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const map = new Map<string, DayGroup>()
  for (const ev of upcoming) {
    const d = new Date(ev.start_date)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString()
    if (!map.has(key)) {
      map.set(key, {
        date: d,
        label: formatDayLabel(d),
        isToday: isToday(d),
        events: [],
      })
    }
    map.get(key)!.events.push(ev)
  }

  return [...map.values()].slice(0, 60) // cap at 60 days ahead
})

function formatDayLabel(date: Date): string {
  const now = new Date()
  if (isToday(date)) return 'Hoje'
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (isSameDay(date, tomorrow)) return 'Amanhã'
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatEventTime(event: CalendarEvent): string {
  if (event.is_all_day) return 'Dia todo'
  const d = new Date(event.start_date)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <EmptyState
      v-if="grouped.length === 0"
      :icon="CalendarDays"
      title="Nenhum evento próximo"
      description="Crie um evento para vê-lo aqui."
      cta-label="Novo evento"
      @cta="emit('create')"
    />

    <div v-else class="max-w-2xl mx-auto px-5 py-4 space-y-6">
      <div v-for="group in grouped" :key="group.date.toISOString()">
        <!-- Day header -->
        <div class="flex items-center gap-3 mb-2">
          <span
            class="text-[11px] font-semibold uppercase tracking-[0.1em] capitalize"
            :style="group.isToday
              ? 'color: hsl(var(--primary))'
              : 'color: hsl(var(--muted-foreground) / 0.5)'"
          >
            {{ group.label }}
          </span>
          <div class="flex-1 h-px" style="background: hsl(var(--border) / 0.35)" />
        </div>

        <!-- Events for this day -->
        <div class="space-y-1">
          <div
            v-for="event in group.events"
            :key="event.id"
            class="flex items-start gap-3 px-3 py-2.5 rounded-md transition-base cursor-pointer"
            style="border: 1px solid hsl(var(--border) / 0.4)"
            @mouseenter="(e) => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--accent) / 0.5)'"
            @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
            @click="emit('clickEvent', event)"
          >
            <!-- Color bar -->
            <div
              class="mt-[3px] w-1.5 h-1.5 rounded-full shrink-0"
              :style="{ background: COLOR_MAP[event.color ?? 'blue'] ?? COLOR_MAP.blue }"
            />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-medium text-foreground truncate leading-snug">
                {{ event.title }}
              </p>
              <p v-if="event.location" class="text-[11px] truncate mt-0.5" style="color: hsl(var(--muted-foreground) / 0.5)">
                {{ event.location }}
              </p>
            </div>

            <!-- Time -->
            <span class="shrink-0 text-[11px] tabular-nums font-mono" style="color: hsl(var(--muted-foreground) / 0.45)">
              {{ formatEventTime(event) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
