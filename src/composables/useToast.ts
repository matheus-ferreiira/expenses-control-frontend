import { toast as sonnerToast } from 'vue-sonner'

export function useToast() {
  function success(message: string, description?: string) {
    sonnerToast.success(message, { description })
  }

  function error(message: string, description?: string) {
    sonnerToast.error(message, { description })
  }

  function info(message: string, description?: string) {
    sonnerToast.info(message, { description })
  }

  function warning(message: string, description?: string) {
    sonnerToast.warning(message, { description })
  }

  function toast(message: string, description?: string) {
    sonnerToast(message, { description })
  }

  return { toast, success, error, info, warning }
}
