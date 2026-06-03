import { reactive, ref } from 'vue'
import type { CreditCard } from '@/types/finance'
import type { CreateCreditCardPayload } from '../types'
import { CARD_COLORS } from '../types'

export interface CreditCardFormData {
  name: string
  limit_amount: string
  closing_day: string
  due_day: string
  color: string
  bank_account_id: string
}

export interface CreditCardFormErrors {
  name?: string
  limit_amount?: string
  closing_day?: string
  due_day?: string
  bank_account_id?: string
}

const DEFAULTS: CreditCardFormData = {
  name: '',
  limit_amount: '',
  closing_day: '1',
  due_day: '10',
  color: CARD_COLORS[0] ?? '#8b5cf6',
  bank_account_id: '',
}

export function useCreditCardForm() {
  const form = reactive<CreditCardFormData>({ ...DEFAULTS })
  const errors = reactive<CreditCardFormErrors>({})
  const submitting = ref(false)

  function fromCard(card: CreditCard) {
    form.name = card.name
    form.limit_amount = card.limit_amount.toFixed(2).replace('.', ',')
    form.closing_day = card.closing_day.toString()
    form.due_day = card.due_day.toString()
    form.color = card.color
    form.bank_account_id = card.bank_account_id ?? ''
    Object.assign(errors, {})
  }

  function reset() {
    Object.assign(form, { ...DEFAULTS })
    Object.assign(errors, {})
    submitting.value = false
  }

  function validate(isEdit = false): boolean {
    Object.assign(errors, {})
    let valid = true
    if (!form.name.trim()) {
      errors.name = 'Nome é obrigatório'
      valid = false
    }
    const limit = parseFloat(form.limit_amount.replace(',', '.'))
    if (!form.limit_amount || isNaN(limit) || limit <= 0) {
      errors.limit_amount = 'Limite deve ser maior que zero'
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
    if (!isEdit && !form.bank_account_id) {
      errors.bank_account_id = 'Selecione a conta bancária que pagará este cartão'
      valid = false
    }
    return valid
  }

  function toPayload(): CreateCreditCardPayload {
    return {
      name: form.name.trim(),
      limit_amount: parseFloat(form.limit_amount.replace(',', '.')) || 0,
      closing_day: parseInt(form.closing_day) || 1,
      due_day: parseInt(form.due_day) || 10,
      color: form.color,
      is_active: true,
      bank_account_id: form.bank_account_id || undefined,
    }
  }

  return { form, errors, submitting, fromCard, reset, validate, toPayload }
}
