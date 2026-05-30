<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Skeleton } from '@ui/skeleton'
import { Calendar, ArrowRight } from 'lucide-vue-next'
import type { CalendarEvent } from '@/types/calendar'
import { ROUTES } from '@/constants/routes'

defineProps<{
  events: CalendarEvent[]
  loading?: boolean
}>()

const router = useRouter()

const EVENT_COLORS: Record<string, string> = {
  blue:   'hsl(var(--primary))',           // no blue token — maps to brand green
  green:  'hsl(var(--success))',
  yellow: 'hsl(var(--warning))',
  red:    'hsl(var(--destructive))',
  pink:   'hsl(var(--muted-foreground))',  // no pink token — neutral fallback
  orange: 'hsl(var(--warning))',           // no orange token — nearest semantic
  slate:  'hsl(var(--muted-foreground))',
}

function eventTime(event: CalendarEvent): string {
  if (event.is_all_day) return 'Dia todo'
  const d = new Date(event.start_date)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function eventEndTime(event: CalendarEvent): string {
  if (event.is_all_day) return ''
  const d = new Date(event.end_date)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border/40">
      <div class="flex items-center gap-2">
        <Calendar :size="13" class="text-muted-foreground" />
        <span class="text-sm font-medium text-foreground">Agenda de hoje</span>
      </div>
      <button
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-base"
        @click="router.push({ name: ROUTES.CALENDAR })"
      >
        Ver <ArrowRight :size="10" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-2.5">
      <div v-for="i in 3" :key="i" class="flex items-start gap-3">
        <Skeleton class="h-3 w-12 mt-0.5 shrink-0" />
        <div class="flex-1 space-y-1">
          <Skeleton class="h-3 w-3/4" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="events.length === 0" class="px-4 py-5 text-center">
      <p class="text-xs text-muted-foreground/50">Nenhum evento hoje.</p>
    </div>

    <!-- Time-slot events -->
    <div v-else class="divide-y divide-border/40">
      <div
        v-for="event in events"
        :key="event.id"
        class="flex items-start gap-3 px-4 py-2.5 hover:bg-accent/20 transition-base"
      >
        <!-- Time column -->
        <div class="shrink-0 w-[72px] text-right">
          <span class="text-[11px] tabular-nums font-mono text-muted-foreground/50">
            {{ eventTime(event) }}
            <template v-if="!event.is_all_day && eventEndTime(event)">
              – {{ eventEndTime(event) }}
            </template>
          </span>
        </div>

        <!-- Color bar -->
        <div
          class="mt-[5px] h-1.5 w-1.5 rounded-full shrink-0"
          :style="{ backgroundColor: EVENT_COLORS[event.color ?? ''] ?? 'hsl(var(--muted-foreground))' }"
        />

        <!-- Title -->
        <div class="flex-1 min-w-0">
          <p class="text-[13px] text-foreground truncate leading-none">
            {{ event.title }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
