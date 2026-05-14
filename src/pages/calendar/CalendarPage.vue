<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, Link } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { useCalendarNav } from '@/features/calendar/composables/useCalendarNav'
import { useCalendarGrid } from '@/features/calendar/composables/useCalendarGrid'
import { useCalendarStore } from '@/stores/calendar'
import CalendarMonthHeader from '@/features/calendar/components/CalendarMonthHeader.vue'
import CalendarMonthGrid from '@/features/calendar/components/CalendarMonthGrid.vue'
import CalendarWeekGrid from '@/features/calendar/components/CalendarWeekGrid.vue'
import CalendarAgendaView from '@/features/calendar/components/CalendarAgendaView.vue'
import CalendarEventModal from '@/features/calendar/components/CalendarEventModal.vue'
import type { CalendarDay, CalendarEvent } from '@/types/calendar'

const store = useCalendarStore()
const nav = useCalendarNav()
const modal = ref<InstanceType<typeof CalendarEventModal> | null>(null)
const toast = useToast()

const isCurrentPeriod = computed(() => {
  const now = new Date()
  if (nav.viewMode.value === 'week') {
    const weekStart = nav.currentWeekStart.value
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return now >= weekStart && now <= weekEnd
  }
  return (
    nav.currentYear.value === now.getFullYear() &&
    nav.currentMonth.value === now.getMonth()
  )
})

const { weeks } = useCalendarGrid(nav.currentYear, nav.currentMonth, computed(() => store.events))

async function loadCurrentPeriod() {
  await store.fetchForMonth(nav.currentYear.value, nav.currentMonth.value)
  if (nav.viewMode.value === 'week') {
    const weekEnd = nav.weekDays.value[6]
    if (weekEnd && weekEnd.getMonth() !== nav.currentMonth.value) {
      await store.fetchForMonth(weekEnd.getFullYear(), weekEnd.getMonth())
    }
  }
}

onMounted(loadCurrentPeriod)
watch([nav.currentYear, nav.currentMonth, nav.viewMode], loadCurrentPeriod)

function handleClickDay(day: CalendarDay) {
  modal.value?.openCreate(day.date)
}

function handleClickEvent(event: CalendarEvent) {
  modal.value?.openEdit(event)
}

async function handleDropEvent(eventId: string, targetDay: CalendarDay) {
  const event = store.events.find((e) => e.id === eventId)
  if (!event) return
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const duration = endDate.getTime() - startDate.getTime()
  const newStart = new Date(targetDay.date)
  newStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)
  const newEnd = new Date(newStart.getTime() + duration)
  try {
    await store.updateEvent(eventId, {
      start_date: newStart.toISOString(),
      end_date: newEnd.toISOString(),
    })
  } catch {
    toast.error('Erro ao mover evento')
  }
}

function handleClickSlot(date: Date, hour: number) {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  modal.value?.openCreate(d)
}

function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === 'n' || e.key === 'N') {
    modal.value?.openCreate()
    return
  }
  if (e.key === 'ArrowLeft') nav.prev()
  if (e.key === 'ArrowRight') nav.next()
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

    <!-- Navigation header -->
    <CalendarMonthHeader
      :month-label="nav.headerLabel.value"
      :view-mode="nav.viewMode.value"
      :is-current-month="isCurrentPeriod"
      @prev="nav.prev()"
      @next="nav.next()"
      @today="nav.goToday()"
      @update:view-mode="nav.setView($event)"
    />

    <!-- Month grid -->
    <CalendarMonthGrid
      v-if="nav.viewMode.value === 'month'"
      :weeks="weeks"
      :loading="store.loading"
      @click-day="handleClickDay"
      @click-event="handleClickEvent"
      @drop-event="handleDropEvent"
    />

    <!-- Week grid -->
    <CalendarWeekGrid
      v-else-if="nav.viewMode.value === 'week'"
      :week-days="nav.weekDays.value"
      :events="store.events"
      :loading="store.loading"
      @click-event="handleClickEvent"
      @click-slot="handleClickSlot"
    />

    <!-- Agenda list -->
    <CalendarAgendaView
      v-else-if="nav.viewMode.value === 'agenda'"
      :events="store.events"
      @click-event="handleClickEvent"
      @create="modal?.openCreate()"
    />

    <!-- Event create/edit modal -->
    <CalendarEventModal ref="modal" />
  </div>
</template>
