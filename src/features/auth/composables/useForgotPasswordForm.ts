import { reactive, ref } from 'vue'

export function useForgotPasswordForm() {
  const form = reactive({ email: '' })
  const errors = reactive({ email: undefined as string | undefined })
  const sent = ref(false)
  const loading = ref(false)

  function validate(): boolean {
    errors.email = undefined

    if (!form.email.trim()) {
      errors.email = 'Email obrigatório'
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Email inválido'
      return false
    }

    return true
  }

  return { form, errors, sent, loading, validate }
}
