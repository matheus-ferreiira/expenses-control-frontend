import { reactive, ref } from 'vue'
import type { Transaction, TransactionType, CreateTransactionPayload } from '@/types/finance'
import { toISODate } from '@/utils/date'

export interface TransactionFormData {
  type: TransactionType
  description: string
  amount: string
  transaction_date: string
  category_id: string
  account_id: string
  card_id: string
  notes: string
  is_recurring: boolean
  tag_ids: string[]
}

export interface TransactionFormErrors {
  description?: string
  amount?: string
  transaction_date?: string
  account_id?: string
}

const DEFAULTS: TransactionFormData = {
  type: 'expense',
  description: '',
  amount: '',
  transaction_date: '',
  category_id: '',
  account_id: '',
  card_id: '',
  notes: '',
  is_recurring: false,
  tag_ids: [],
}

export function useTransactionForm() {
  const form = reactive<TransactionFormData>({ ...DEFAULTS })
  const errors = reactive<TransactionFormErrors>({})
  const submitting = ref(false)

  function fromTransaction(t: Transaction) {
    form.type = t.type
    form.description = t.description
    form.amount = t.amount.toString()
    form.transaction_date = t.transaction_date
    form.category_id = t.category_id ?? ''
    form.account_id = t.account_id ?? ''
    form.card_id = t.card_id ?? ''
    form.notes = t.notes ?? ''
    form.is_recurring = t.is_recurring
    form.tag_ids = t.tags?.map((tag) => tag.id) ?? []
    Object.assign(errors, {})
  }

  function reset() {
    Object.assign(form, { ...DEFAULTS, transaction_date: toISODate(new Date()) })
    Object.assign(errors, {})
    submitting.value = false
  }

  function validate(): boolean {
    Object.assign(errors, {})
    let valid = true
    if (!form.description.trim()) {
      errors.description = 'Descrição é obrigatória'
      valid = false
    }
    const parsed = parseFloat(form.amount.replace(',', '.'))
    if (!form.amount || isNaN(parsed) || parsed <= 0) {
      errors.amount = 'Valor deve ser maior que zero'
      valid = false
    }
    if (!form.transaction_date) {
      errors.transaction_date = 'Data é obrigatória'
      valid = false
    }
    if (!form.account_id) {
      errors.account_id = 'Selecione uma conta'
      valid = false
    }
    return valid
  }

  function applyApiErrors(apiErrors: Record<string, string[]>) {
    if (apiErrors.description) errors.description = apiErrors.description[0]
    if (apiErrors.amount) errors.amount = apiErrors.amount[0]
    if (apiErrors.transaction_date) errors.transaction_date = apiErrors.transaction_date[0]
    if (apiErrors.account_id) errors.account_id = apiErrors.account_id[0]
  }

  function toPayload(): CreateTransactionPayload {
    const amount = parseFloat(form.amount.replace(',', '.'))
    const payload: CreateTransactionPayload = {
      type: form.type,
      description: form.description.trim(),
      amount,
      transaction_date: form.transaction_date,
    }
    if (form.category_id) payload.category_id = form.category_id
    if (form.account_id) payload.account_id = form.account_id
    if (form.card_id) payload.card_id = form.card_id
    if (form.notes.trim()) payload.notes = form.notes.trim()
    payload.is_recurring = form.is_recurring  // always send — needed to unmark on updates
    if (form.tag_ids.length > 0) payload.tag_ids = [...form.tag_ids]
    return payload
  }

  return {
    form,
    errors,
    submitting,
    fromTransaction,
    reset,
    validate,
    applyApiErrors,
    toPayload,
  }
}
