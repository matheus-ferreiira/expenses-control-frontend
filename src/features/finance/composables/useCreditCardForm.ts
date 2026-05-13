import { reactive, ref } from 'vue'
import type { CreditCard, CreditCardNetwork } from '@/types/finance'
import type { CreateCreditCardPayload } from '../types'
import { CARD_COLORS } from '../types'

export interface CreditCardFormData {
  name: string
  network: CreditCardNetwork
  credit_limit: string
  current_balance: string
  closing_day: string
  due_day: string
  color: string
}

export interface CreditCardFormErrors {
  name?: string
  credit_limit?: string
  closing_day?: string
  due_day?: string
}

const DEFAULTS: CreditCardFormData = {
  name: '',
  network: 'visa',
  credit_limit: '',
  current_balance: '0',
  closing_day: '1',
  due_day: '10',
  color: CARD_COLORS[0] ?? '#8b5cf6',
}

export function useCreditCardForm() {
  const form = reactive<CreditCardFormData>({ ...DEFAULTS })
  const errors = reactive<CreditCardFormErrors>({})
  const submitting = ref(false)

  function fromCard(card: CreditCard) {
    form.name = card.name
    form.network = card.network
    form.credit_limit = card.credit_limit.toString()
    form.current_balance = card.current_balance.toString()
    form.closing_day = card.closing_day.toString()
    form.due_day = card.due_day.toString()
    form.color = card.color
    Object.assign(errors, {})
  }

  function reset() {
    Object.assign(form, { ...DEFAULTS })
    Object.assign(errors, {})
    submitting.value = false
  }

  function validate(): boolean {
    Object.assign(errors, {})
    let valid = true
    if (!form.name.trim()) {
      errors.name = 'Nome é obrigatório'
      valid = false
    }
    const limit = parseFloat(form.credit_limit.replace(',', '.'))
    if (!form.credit_limit || isNaN(limit) || limit <= 0) {
      errors.credit_limit = 'Limite deve ser maior que zero'
      valid = false
    }
    const closing = parseInt(form.closing_day)
    if (isNaN(closing) || closing < 1 || closing > 31) {
      errors.closing_day = 'Dia inválido (1–31)'
      valid = false
    }
    const due = parseInt(form.due_day)
    if (isNaN(due) || due < 1 || due > 31) {
      errors.due_day = 'Dia inválido (1–31)'
      valid = false
    }
    return valid
  }

  function toPayload(): CreateCreditCardPayload {
    return {
      name: form.name.trim(),
      network: form.network,
      credit_limit: parseFloat(form.credit_limit.replace(',', '.')) || 0,
      current_balance: parseFloat(form.current_balance.replace(',', '.')) || 0,
      closing_day: parseInt(form.closing_day) || 1,
      due_day: parseInt(form.due_day) || 10,
      color: form.color,
      is_active: true,
    }
  }

  return { form, errors, submitting, fromCard, reset, validate, toPayload }
}
