<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { ViewMode } from '@/types/calendar'

defineProps<{
  monthLabel: string
  viewMode: ViewMode
  isCurrentMonth: boolean
  isCurrent?: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  today: []
  'update:viewMode': [mode: ViewMode]
}>()

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'month', label: 'Mês' },
  { id: 'week', label: 'Semana' },
  { id: 'agenda', label: 'Agenda' },
]
</script>

<template>
  <div class="flex items-center justify-between px-5 py-3 border-b shrink-0" style="border-color: hsl(var(--border) / 0.5)">
    <!-- Left: month label + nav arrows -->
    <div class="flex items-center gap-3">
      <h2 class="text-[15px] font-semibold text-foreground tracking-tight">
        {{ monthLabel }}
      </h2>
      <div class="flex items-center gap-0.5">
        <button
          class="flex items-center justify-center w-6 h-6 rounded-md transition-base"
          style="color: hsl(var(--muted-foreground) / 0.5)"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.5)'"
          @click="emit('prev')"
        >
          <ChevronLeft :size="14" />
        </button>
        <button
          class="flex items-center justify-center w-6 h-6 rounded-md transition-base"
          style="color: hsl(var(--muted-foreground) / 0.5)"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.5)'"
          @click="emit('next')"
        >
          <ChevronRight :size="14" />
        </button>
      </div>
      <button
        v-if="!isCurrentMonth"
        class="h-6 px-2.5 rounded-md text-[11px] font-medium transition-base"
        style="color: hsl(var(--primary)); background: hsl(var(--primary) / 0.1)"
        @mouseenter="(e) => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary) / 0.18)'"
        @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary) / 0.1)'"
        @click="emit('today')"
      >
        Hoje
      </button>
    </div>

    <!-- Right: view switcher -->
    <div class="flex items-center gap-0.5 rounded-md p-0.5" style="background: hsl(var(--border) / 0.4)">
      <button
        v-for="view in VIEWS"
        :key="view.id"
        class="px-3 h-6 rounded text-[12px] font-medium transition-base"
        :style="viewMode === view.id
          ? 'background: hsl(var(--card)); color: hsl(var(--foreground)); box-shadow: 0 1px 2px hsl(0 0% 0% / 0.15)'
          : 'color: hsl(var(--muted-foreground) / 0.6)'"
        @click="emit('update:viewMode', view.id)"
      >
        {{ view.label }}
      </button>
    </div>
  </div>
</template>
