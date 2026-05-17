import { reactive, ref } from 'vue'
import type { Habit, HabitFrequency, CreateHabitPayload } from '@/types/habits'
import { HABIT_COLORS } from '../types'

export interface HabitFormData {
  name: string
  description: string
  frequency: HabitFrequency
  target_days: number[]
  category: string | null
  color: string
  icon: string
}

export interface HabitFormErrors {
  name?: string
  frequency?: string
}

const DEFAULTS: HabitFormData = {
  name: '',
  description: '',
  frequency: 'daily',
  target_days: [],
  category: null,
  color: HABIT_COLORS[0]?.value ?? '#8b5cf6',
  icon: '',
}

export function useHabitForm() {
  const form = reactive<HabitFormData>({ ...DEFAULTS })
  const errors = reactive<HabitFormErrors>({})
  const submitting = ref(false)

  function fromHabit(habit: Habit) {
    form.name = habit.name
    form.description = habit.description ?? ''
    form.frequency = habit.frequency
    form.target_days = [...habit.target_days]
    form.category = habit.category ?? null
    form.color = habit.color ?? HABIT_COLORS[0]?.value ?? '#8b5cf6'
    form.icon = habit.icon ?? ''
    Object.assign(errors, {})
  }

  function reset() {
    Object.assign(form, DEFAULTS)
    form.target_days = []
    Object.assign(errors, {})
    submitting.value = false
  }

  function validate(): boolean {
    Object.assign(errors, {})
    if (!form.name.trim()) {
      errors.name = 'Nome é obrigatório'
      return false
    }
    return true
  }

  function toggleTargetDay(day: number) {
    const idx = form.target_days.indexOf(day)
    if (idx === -1) form.target_days.push(day)
    else form.target_days.splice(idx, 1)
  }

  function toPayload(): CreateHabitPayload {
    const payload: CreateHabitPayload = {
      name: form.name.trim(),
      frequency_type: form.frequency,
    }
    if (form.description.trim()) payload.description = form.description.trim()
    if (form.target_days.length) payload.target_days = [...form.target_days]
    if (form.category) payload.category = form.category
    if (form.color) payload.color = form.color
    if (form.icon.trim()) payload.icon = form.icon.trim()
    return payload
  }

  return {
    form,
    errors,
    submitting,
    fromHabit,
    reset,
    validate,
    toggleTargetDay,
    toPayload,
  }
}
