import { reactive, ref } from 'vue'
import type { Transaction, TransactionType, CreateTransactionPayload } from '@/types/finance'
import { toISODate } from '@/utils/date'

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'
export type RecurrenceEndType = 'never' | 'count' | 'date'

export interface TransactionFormData {
  type: TransactionType
  description: string
  amount: string
  transaction_date: string
  category_id: string
  account_id: string
  /** For type=transfer: the account being credited */
  destination_account_id: string
  card_id: string
  notes: string
  is_recurring: boolean
  /** Recurrence configuration when is_recurring=true */
  recurrence_frequency: RecurrenceFrequency
  recurrence_end_type: RecurrenceEndType
  recurrence_count: number
  recurrence_end_date: string
  /** Number of installments — mutually exclusive with is_recurring. 0 = not a parcelamento. */
  total_installments: number
  tag_ids: string[]
}

export interface TransactionFormErrors {
  description?: string
  amount?: string
  transaction_date?: string
  account_id?: string
  destination_account_id?: string
}

const DEFAULTS: TransactionFormData = {
  type: 'expense',
  description: '',
  amount: '',
  transaction_date: '',
  category_id: '',
  account_id: '',
  destination_account_id: '',
  card_id: '',
  notes: '',
  is_recurring: false,
  recurrence_frequency: 'monthly',
  recurrence_end_type: 'never',
  recurrence_count: 12,
  recurrence_end_date: '',
  total_installments: 0,
  tag_ids: [],
}

export function useTransactionForm() {
  const form = reactive<TransactionFormData>({ ...DEFAULTS })
  const errors = reactive<TransactionFormErrors>({})
  const submitting = ref(false)

  function fromTransaction(t: Transaction) {
    form.type = t.type
    form.description = t.description
    // Strip the "(N/M)" suffix from installment description for clean editing
    form.description = t.installment_number && t.total_installments
      ? t.description.replace(/ \(\d+\/\d+\)$/, '')
      : t.description
    form.amount = t.amount.toString()
    form.transaction_date = t.transaction_date
    form.category_id = t.category_id ?? ''
    form.account_id = t.account_id ?? ''
    form.destination_account_id = t.destination_account_id ?? ''
    form.card_id = t.card_id ?? ''
    form.notes = t.notes ?? ''
    form.is_recurring = t.is_recurring
    // Restore recurrence_config if present
    const cfg = t.recurrence_config as Record<string, unknown> | null
    form.recurrence_frequency = (cfg?.frequency as RecurrenceFrequency) ?? 'monthly'
    form.recurrence_end_type = (cfg?.end_type as RecurrenceEndType) ?? 'never'
    form.recurrence_count = (cfg?.count as number) ?? 12
    form.recurrence_end_date = (cfg?.end_date as string) ?? ''
    form.total_installments = 0 // don't pre-fill installments on edit
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
    if (form.type === 'transfer') {
      if (!form.destination_account_id) {
        errors.destination_account_id = 'Selecione a conta de destino'
        valid = false
      } else if (form.destination_account_id === form.account_id) {
        errors.destination_account_id = 'Conta de destino deve ser diferente da origem'
        valid = false
      }
    }
    return valid
  }

  function applyApiErrors(apiErrors: Record<string, string[]>) {
    if (apiErrors.description) errors.description = apiErrors.description[0]
    if (apiErrors.amount) errors.amount = apiErrors.amount[0]
    if (apiErrors.transaction_date) errors.transaction_date = apiErrors.transaction_date[0]
    if (apiErrors.account_id) errors.account_id = apiErrors.account_id[0]
    if (apiErrors.destination_account_id) errors.destination_account_id = apiErrors.destination_account_id[0]
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
    if (form.type === 'transfer' && form.destination_account_id) {
      payload.destination_account_id = form.destination_account_id
    }
    if (form.card_id) payload.card_id = form.card_id
    if (form.notes.trim()) payload.notes = form.notes.trim()
    if (form.total_installments >= 2) {
      payload.total_installments = form.total_installments
      // Installments are mutually exclusive with recurring
    } else {
      payload.is_recurring = form.is_recurring
      if (form.is_recurring) {
        payload.recurrence_config = {
          frequency: form.recurrence_frequency,
          end_type: form.recurrence_end_type,
          count: form.recurrence_end_type === 'count' ? form.recurrence_count : null,
          end_date: form.recurrence_end_type === 'date' ? form.recurrence_end_date || null : null,
        }
      }
    }
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
