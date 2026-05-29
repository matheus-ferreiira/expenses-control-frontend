import { ref } from 'vue'
import type { TransactionType } from '@/types/finance'

// Module-level singletons — shared across the app without Pinia inference issues
const transactionFormOpen = ref(false)
const transactionFormPrefill = ref<{ type?: TransactionType } | null>(null)

export function useTransactionForm() {
  function openTransactionForm(prefill?: { type?: TransactionType }) {
    transactionFormPrefill.value = prefill ?? null
    transactionFormOpen.value = true
  }

  return {
    transactionFormOpen,
    transactionFormPrefill,
    openTransactionForm,
  }
}
