<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Calendar, ArrowRight } from 'lucide-vue-next'
import type { CalendarEvent } from '@/types/calendar'
import { ROUTES } from '@/constants/routes'

const props = defineProps<{
  events: CalendarEvent[]
  loading?: boolean
}>()

const router = useRouter()

const EVENT_COLORS: Record<string, string> = {
  violet: '#8b5cf6',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  orange: '#f97316',
  slate: '#64748b',
}

const weekDays = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    const hasEvent = props.events.some((e) => e.start_datetime.startsWith(d.toISOString().split('T')[0] ?? ''))
    return {
      label: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][d.getDay() === 0 ? 6 : d.getDay() - 1],
      day: d.getDate(),
      isToday,
      hasEvent,
    }
  })
})

function eventTime(event: CalendarEvent): string {
  if (event.all_day) return 'Dia todo'
  const d = new Date(event.start_datetime)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function eventDuration(event: CalendarEvent): string {
  if (event.all_day) return ''
  const start = new Date(event.start_datetime)
  const end = new Date(event.end_datetime)
  const diffMin = Math.round((end.getTime() - start.getTime()) / 60000)
  if (diffMin < 60) return `${diffMin}min`
  const h = Math.floor(diffMin / 60)
  const m = diffMin % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <div class="flex items-center gap-2">
        <Calendar :size="13" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Agenda</span>
      </div>
      <button
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        @click="router.push({ name: ROUTES.CALENDAR })"
      >
        Ver <ArrowRight :size="10" />
      </button>
    </div>

    <!-- Mini weekly calendar -->
    <div class="px-4 pt-3 pb-2">
      <div class="grid grid-cols-7 gap-0.5">
        <div
          v-for="(day, i) in weekDays"
          :key="i"
          class="flex flex-col items-center gap-0.5"
        >
          <span class="text-[9px] text-muted-foreground/50 font-medium uppercase">
            {{ day.label }}
          </span>
          <div
            :class="[
              'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors',
              day.isToday
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            {{ day.day }}
          </div>
          <div
            :class="[
              'h-1 w-1 rounded-full',
              day.hasEvent ? 'bg-primary/60' : 'bg-transparent',
            ]"
          />
        </div>
      </div>
    </div>

    <div class="border-t border-border/40" />

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-2.5">
      <div v-for="i in 2" :key="i" class="flex items-start gap-2.5">
        <Skeleton class="h-3 w-10 mt-0.5 shrink-0" />
        <Skeleton class="h-3 flex-1" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="events.length === 0" class="px-4 py-4 text-center">
      <p class="text-xs text-muted-foreground/50">Sem eventos hoje.</p>
    </div>

    <!-- Events -->
    <div v-else class="divide-y divide-border/40">
      <div
        v-for="event in events"
        :key="event.id"
        class="flex items-start gap-2.5 px-4 py-2.5 hover:bg-accent/20 transition-colors"
      >
        <div
          class="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 mt-[5px]"
          :style="{ backgroundColor: EVENT_COLORS[event.color] ?? '#64748b' }"
        />
        <div class="flex-1 min-w-0">
          <p class="text-[13px] text-foreground truncate leading-none mb-0.5">
            {{ event.title }}
          </p>
          <p class="text-[11px] text-muted-foreground/60">
            {{ eventTime(event) }}<span v-if="eventDuration(event)"> · {{ eventDuration(event) }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
