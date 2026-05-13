import { reactive } from 'vue'

interface RegisterForm {
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface RegisterErrors {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
}

export function useRegisterForm() {
  const form = reactive<RegisterForm>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const errors = reactive<RegisterErrors>({})

  function validate(): boolean {
    errors.name = undefined
    errors.email = undefined
    errors.password = undefined
    errors.password_confirmation = undefined
    let valid = true

    if (!form.name.trim()) {
      errors.name = 'Nome obrigatório'
      valid = false
    }

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
    } else if (form.password.length < 8) {
      errors.password = 'Mínimo 8 caracteres'
      valid = false
    }

    if (!form.password_confirmation) {
      errors.password_confirmation = 'Confirme a senha'
      valid = false
    } else if (form.password !== form.password_confirmation) {
      errors.password_confirmation = 'Senhas não conferem'
      valid = false
    }

    return valid
  }

  return { form, errors, validate }
}
