<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, Link } from 'lucide-vue-next'
import { useCalendarNav } from '@/features/calendar/composables/useCalendarNav'
import { useCalendarGrid } from '@/features/calendar/composables/useCalendarGrid'
import { useCalendarStore } from '@/stores/calendar'
import CalendarMonthHeader from '@/features/calendar/components/CalendarMonthHeader.vue'
import CalendarMonthGrid from '@/features/calendar/components/CalendarMonthGrid.vue'
import CalendarEventModal from '@/features/calendar/components/CalendarEventModal.vue'
import type { CalendarDay, CalendarEvent } from '@/types/calendar'

const store = useCalendarStore()
const nav = useCalendarNav()
const modal = ref<InstanceType<typeof CalendarEventModal> | null>(null)

const isCurrentMonth = computed(() => {
  const now = new Date()
  return (
    nav.currentYear.value === now.getFullYear() &&
    nav.currentMonth.value === now.getMonth()
  )
})

const { weeks } = useCalendarGrid(nav.currentYear, nav.currentMonth, computed(() => store.events))

async function loadCurrentMonth() {
  await store.fetchForMonth(nav.currentYear.value, nav.currentMonth.value)
}

onMounted(loadCurrentMonth)
watch([nav.currentYear, nav.currentMonth], loadCurrentMonth)

function handleClickDay(day: CalendarDay) {
  modal.value?.openCreate(day.date)
}

function handleClickEvent(event: CalendarEvent) {
  modal.value?.openEdit(event)
}

function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === 'n' || e.key === 'N') modal.value?.openCreate()
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="flex flex-col h-[calc(100dvh-3rem)] md:h-dvh overflow-hidden">
    <!-- Page header bar -->
    <div class="flex items-center justify-between px-5 py-3 border-b shrink-0" style="border-color: hsl(var(--border) / 0.5)">
      <div>
        <p class="text-[10px] font-semibold tracking-[0.12em] uppercase mb-0.5 select-none" style="color: hsl(var(--muted-foreground) / 0.4)">PRODUTIVIDADE</p>
        <h1 class="text-[18px] font-semibold text-foreground tracking-tight leading-tight">Agenda</h1>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium transition-base"
          style="color: hsl(var(--muted-foreground) / 0.7); border: 1px solid hsl(var(--border) / 0.6)"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.7)'"
        >
          <Link :size="12" />
          Google Calendar
        </button>
        <button
          class="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium transition-base"
          style="color: hsl(var(--foreground)); border: 1px solid hsl(var(--border))"
          @mouseenter="(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--accent))' }"
          @mouseleave="(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }"
          @click="modal?.openCreate()"
        >
          <Plus :size="12" />
          Novo evento
        </button>
      </div>
    </div>

    <!-- Month navigation header -->
    <CalendarMonthHeader
      :month-label="nav.monthLabel.value"
      :view-mode="nav.viewMode.value"
      :is-current-month="isCurrentMonth"
      @prev="nav.prevMonth()"
      @next="nav.nextMonth()"
      @today="nav.goToday()"
      @update:view-mode="nav.setView($event)"
    />

    <!-- Calendar grid -->
    <CalendarMonthGrid
      v-if="nav.viewMode.value === 'month'"
      :weeks="weeks"
      :loading="store.loading"
      @click-day="handleClickDay"
      @click-event="handleClickEvent"
    />

    <!-- Agenda view stub -->
    <div
      v-else
      class="flex-1 flex items-center justify-center"
    >
      <p class="text-[13px]" style="color: hsl(var(--muted-foreground) / 0.4)">
        Agenda view — Sprint 7
      </p>
    </div>

    <!-- Event create/edit modal -->
    <CalendarEventModal ref="modal" />
  </div>
</template>
