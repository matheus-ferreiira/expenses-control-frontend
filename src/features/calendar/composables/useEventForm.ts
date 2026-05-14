import { ref, computed } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useToast } from '@/composables/useToast'
import type { CalendarEvent, EventColor } from '@/types/calendar'

export type EventFormMode = 'create' | 'edit'

function toLocalDateTimeInput(isoStr: string): string {
  const d = new Date(isoStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toLocalDateInput(isoStr: string): string {
  return toLocalDateTimeInput(isoStr).slice(0, 10)
}

function localInputToISO(localStr: string): string {
  return new Date(localStr).toISOString()
}

function defaultStart(date?: Date): string {
  const d = date ?? new Date()
  d.setMinutes(0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

function defaultEnd(startLocal: string): string {
  const d = new Date(startLocal)
  d.setHours(d.getHours() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

export function useEventForm() {
  const store = useCalendarStore()
  const toast = useToast()

  const open = ref(false)
  const mode = ref<EventFormMode>('create')
  const editingId = ref<string | null>(null)
  const submitting = ref(false)

  // Form fields
  const title = ref('')
  const startLocal = ref(defaultStart())
  const endLocal = ref(defaultEnd(startLocal.value))
  const isAllDay = ref(false)
  const color = ref<EventColor>('violet')
  const location = ref('')
  const description = ref('')

  const isValid = computed(() => title.value.trim().length > 0 && startLocal.value && endLocal.value)

  function openCreate(date?: Date) {
    mode.value = 'create'
    editingId.value = null
    title.value = ''
    startLocal.value = defaultStart(date ? new Date(date) : undefined)
    endLocal.value = defaultEnd(startLocal.value)
    isAllDay.value = false
    color.value = 'violet'
    location.value = ''
    description.value = ''
    open.value = true
  }

  function openEdit(event: CalendarEvent) {
    mode.value = 'edit'
    editingId.value = event.id
    title.value = event.title
    startLocal.value = toLocalDateTimeInput(event.start_date)
    endLocal.value = toLocalDateTimeInput(event.end_date)
    isAllDay.value = event.is_all_day
    color.value = event.color ?? 'violet'
    location.value = event.location ?? ''
    description.value = event.description ?? ''
    open.value = true
  }

  function close() {
    open.value = false
  }

  function onAllDayChange(val: boolean) {
    isAllDay.value = val
    if (val) {
      startLocal.value = toLocalDateInput(localInputToISO(startLocal.value))
      endLocal.value = toLocalDateInput(localInputToISO(endLocal.value))
    } else {
      startLocal.value = startLocal.value.includes('T')
        ? startLocal.value
        : startLocal.value + 'T09:00'
      endLocal.value = endLocal.value.includes('T')
        ? endLocal.value
        : endLocal.value + 'T10:00'
    }
  }

  function onStartChange() {
    // Auto-advance end if it's before start
    if (endLocal.value < startLocal.value) {
      endLocal.value = defaultEnd(startLocal.value)
    }
  }

  async function submit() {
    if (!isValid.value || submitting.value) return
    submitting.value = true
    try {
      const payload = {
        title: title.value.trim(),
        start_date: localInputToISO(startLocal.value),
        end_date: localInputToISO(endLocal.value),
        is_all_day: isAllDay.value,
        color: color.value,
        location: location.value.trim() || undefined,
        description: description.value.trim() || undefined,
      }

      if (mode.value === 'create') {
        await store.createEvent(payload)
        toast.success('Evento criado')
      } else if (editingId.value) {
        await store.updateEvent(editingId.value, payload)
        toast.success('Evento atualizado')
      }
      close()
    } catch {
      toast.error('Erro ao salvar evento')
    } finally {
      submitting.value = false
    }
  }

  async function deleteEvent() {
    if (!editingId.value) return
    submitting.value = true
    try {
      await store.deleteEvent(editingId.value)
      toast.success('Evento removido')
      close()
    } catch {
      toast.error('Erro ao remover evento')
    } finally {
      submitting.value = false
    }
  }

  return {
    open,
    mode,
    submitting,
    title,
    startLocal,
    endLocal,
    isAllDay,
    color,
    location,
    description,
    isValid,
    openCreate,
    openEdit,
    close,
    onAllDayChange,
    onStartChange,
    submit,
    deleteEvent,
  }
}
