import { ref, reactive } from 'vue'
import type { Task, TaskStatus, TaskPriority, CreateTaskPayload } from '@/types/tasks'

export interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string
  due_time: string
  label_ids: string[]
  is_recurring: boolean
  recurrence_pattern: string
}

export interface TaskFormErrors {
  title?: string
}

const DEFAULTS: TaskFormData = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'normal',
  due_date: '',
  due_time: '',
  label_ids: [],
  is_recurring: false,
  recurrence_pattern: '',
}

export function useTaskForm() {
  const form = reactive<TaskFormData>({ ...DEFAULTS })
  const errors = reactive<TaskFormErrors>({})
  const submitting = ref(false)

  function fromTask(task: Task) {
    form.title = task.title
    form.description = task.description ?? ''
    form.status = task.status
    form.priority = task.priority
    form.due_date = task.due_date ?? ''
    form.due_time = task.due_time ?? ''
    form.label_ids = task.labels.map((l) => l.id)
    form.is_recurring = task.is_recurring
    form.recurrence_pattern = task.recurrence_pattern ?? ''
    Object.assign(errors, {})
  }

  function reset() {
    Object.assign(form, DEFAULTS)
    Object.assign(errors, {})
    submitting.value = false
  }

  function validate(): boolean {
    Object.assign(errors, {})
    if (!form.title.trim()) {
      errors.title = 'Título é obrigatório'
      return false
    }
    return true
  }

  function toPayload(): CreateTaskPayload {
    const payload: CreateTaskPayload = {
      title: form.title.trim(),
    }
    if (form.description.trim()) payload.description = form.description.trim()
    payload.status = form.status
    payload.priority = form.priority
    if (form.due_date) payload.due_date = form.due_date
    if (form.due_time) payload.due_time = form.due_time
    if (form.label_ids.length) payload.label_ids = form.label_ids
    if (form.is_recurring) {
      payload.is_recurring = true
      if (form.recurrence_pattern) payload.recurrence_pattern = form.recurrence_pattern
    }
    return payload
  }

  return {
    form,
    errors,
    submitting,
    fromTask,
    reset,
    validate,
    toPayload,
  }
}
