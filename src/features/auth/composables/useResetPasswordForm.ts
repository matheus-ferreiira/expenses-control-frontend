import { reactive } from 'vue'

export function useResetPasswordForm() {
  const form = reactive({
    password: '',
    password_confirmation: '',
  })

  const errors = reactive({
    password: undefined as string | undefined,
    password_confirmation: undefined as string | undefined,
  })

  function validate(): boolean {
    errors.password = undefined
    errors.password_confirmation = undefined

    if (!form.password) {
      errors.password = 'Senha obrigatória'
      return false
    }
    if (form.password.length < 8) {
      errors.password = 'Mínimo 8 caracteres'
      return false
    }
    if (!form.password_confirmation) {
      errors.password_confirmation = 'Confirme a senha'
      return false
    }
    if (form.password !== form.password_confirmation) {
      errors.password_confirmation = 'Senhas não conferem'
      return false
    }

    return true
  }

  return { form, errors, validate }
}
