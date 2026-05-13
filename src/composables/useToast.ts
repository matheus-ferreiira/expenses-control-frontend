import { ref } from 'vue'

export type ToastVariant = 'default' | 'success' | 'destructive'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function toast(options: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID()
    const duration = options.duration ?? 4000

    toasts.value.push({ ...options, id })

    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, toast, dismiss }
}
