import { reactive, ref, computed } from 'vue'
import type { BankAccount, AccountType } from '@/types/finance'
import type { CreateAccountPayload } from '../types'
import { ACCOUNT_COLORS } from '../types'

export interface AccountFormData {
  name: string
  type: AccountType
  balance: string
  color: string
}

export interface AccountFormErrors {
  name?: string
  balance?: string
}

const DEFAULTS: AccountFormData = {
  name: '',
  type: 'checking',
  balance: '',
  color: ACCOUNT_COLORS[0] ?? '#3b82f6',
}

export function useAccountForm() {
  const form = reactive<AccountFormData>({ ...DEFAULTS })
  const errors = reactive<AccountFormErrors>({})
  const submitting = ref(false)

  function fromAccount(account: BankAccount) {
    form.name = account.name
    form.type = account.type
    form.balance = account.balance.toFixed(2).replace('.', ',')
    form.color = account.color
    Object.assign(errors, {})
  }

  function reset() {
    Object.assign(form, { ...DEFAULTS })
    Object.assign(errors, {})
    submitting.value = false
  }

  const isFormValid = computed(
    () => !!form.name.trim() && (form.balance === '' || !isNaN(parseFloat(form.balance.replace(',', '.')))),
  )

  function validate(): boolean {
    Object.assign(errors, {})
    let valid = true
    if (!form.name.trim()) {
      errors.name = 'Nome é obrigatório'
      valid = false
    }
    const bal = form.balance === '' ? 0 : parseFloat(form.balance.replace(',', '.'))
    if (isNaN(bal)) {
      errors.balance = 'Saldo inválido'
      valid = false
    }
    return valid
  }

  function toPayload(): CreateAccountPayload {
    return {
      name: form.name.trim(),
      type: form.type,
      balance: parseFloat(form.balance.replace(',', '.')) || 0,
      color: form.color,
      currency: 'BRL',
      is_active: true,
    }
  }

  return { form, errors, submitting, isFormValid, fromAccount, reset, validate, toPayload }
}
