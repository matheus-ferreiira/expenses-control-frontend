import { ref } from 'vue'
import { defineStore } from 'pinia'
import { calendarApi } from '@/services/api/calendar'
import type {
  CalendarEvent,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
  CalendarFilters,
} from '@/types/calendar'

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref<CalendarEvent[]>([])
  const upcoming = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEvents(filters?: CalendarFilters) {
    loading.value = true
    error.value = null
    try {
      events.value = await calendarApi.list(filters)
    } catch (e: unknown) {
      error.value = 'Erro ao carregar eventos'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchUpcoming() {
    upcoming.value = await calendarApi.upcoming()
  }

  async function createEvent(payload: CreateCalendarEventPayload): Promise<CalendarEvent> {
    const event = await calendarApi.create(payload)
    events.value.push(event)
    return event
  }

  async function updateEvent(
    id: string,
    payload: UpdateCalendarEventPayload,
  ): Promise<CalendarEvent> {
    const updated = await calendarApi.update(id, payload)
    const idx = events.value.findIndex((e) => e.id === id)
    if (idx !== -1) events.value[idx] = updated
    return updated
  }

  async function deleteEvent(id: string) {
    await calendarApi.delete(id)
    events.value = events.value.filter((e) => e.id !== id)
  }

  return {
    events,
    upcoming,
    loading,
    error,
    fetchEvents,
    fetchUpcoming,
    createEvent,
    updateEvent,
    deleteEvent,
  }
})
