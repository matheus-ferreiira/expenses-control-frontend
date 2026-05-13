import { reactive } from 'vue'

interface LoginForm {
  email: string
  password: string
}

interface LoginErrors {
  email?: string
  password?: string
}

export function useLoginForm() {
  const form = reactive<LoginForm>({ email: '', password: '' })
  const errors = reactive<LoginErrors>({})

  function validate(): boolean {
    errors.email = undefined
    errors.password = undefined
    let valid = true

    if (!form.email.trim()) {
      errors.email = 'Email obrigatório'
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Email inválido'
      valid = false
    }

    if (!form.password) {
      errors.password = 'Senha obrigatória'
      valid = false
    }

    return valid
  }

  function reset() {
    form.email = ''
    form.password = ''
    errors.email = undefined
    errors.password = undefined
  }

  return { form, errors, validate, reset }
}
