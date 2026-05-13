import { ref } from 'vue'
import { defineStore } from 'pinia'
import { financeApi } from '@/services/api/finance'
import type {
  BankAccount,
  CreditCard,
  Transaction,
  TransactionCategory,
  TransactionFilters,
} from '@/types/finance'

export const useFinanceStore = defineStore('finance', () => {
  const accounts = ref<BankAccount[]>([])
  const cards = ref<CreditCard[]>([])
  const transactions = ref<Transaction[]>([])
  const categories = ref<TransactionCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAccounts() {
    accounts.value = await financeApi.accounts.list()
  }

  async function fetchCards() {
    cards.value = await financeApi.cards.list()
  }

  async function fetchTransactions(filters?: TransactionFilters) {
    loading.value = true
    error.value = null
    try {
      transactions.value = (await financeApi.transactions.list(filters)) as unknown as Transaction[]
    } catch (e: unknown) {
      error.value = 'Erro ao carregar transações'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    categories.value = await financeApi.categories.list()
  }

  async function fetchAll() {
    await Promise.all([fetchAccounts(), fetchCards(), fetchCategories()])
  }

  return {
    accounts,
    cards,
    transactions,
    categories,
    loading,
    error,
    fetchAccounts,
    fetchCards,
    fetchTransactions,
    fetchCategories,
    fetchAll,
  }
})
