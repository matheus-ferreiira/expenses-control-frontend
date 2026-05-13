import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { financeApi } from '@/services/api/finance'
import type {
  BankAccount,
  CreditCard,
  Transaction,
  TransactionCategory,
  TransactionFilters,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from '@/types/finance'
import type {
  CreateAccountPayload,
  UpdateAccountPayload,
  CreateCreditCardPayload,
  UpdateCreditCardPayload,
} from '@/features/finance/types'

export const useFinanceStore = defineStore('finance', () => {
  const accounts = ref<BankAccount[]>([])
  const cards = ref<CreditCard[]>([])
  const transactions = ref<Transaction[]>([])
  const categories = ref<TransactionCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeAccounts = computed(() => accounts.value.filter((a) => a.is_active))
  const activeCards = computed(() => cards.value.filter((c) => c.is_active))

  // ── Fetch ────────────────────────────────────────────────────────────────

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

  // ── Transactions CRUD ────────────────────────────────────────────────────

  async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    const t = await financeApi.transactions.create(payload)
    transactions.value.unshift(t)
    return t
  }

  async function updateTransaction(
    id: string,
    payload: UpdateTransactionPayload,
  ): Promise<Transaction> {
    const updated = await financeApi.transactions.update(id, payload)
    const idx = transactions.value.findIndex((t) => t.id === id)
    if (idx !== -1) transactions.value[idx] = updated
    return updated
  }

  async function deleteTransaction(id: string): Promise<void> {
    await financeApi.transactions.delete(id)
    transactions.value = transactions.value.filter((t) => t.id !== id)
  }

  // ── Accounts CRUD ────────────────────────────────────────────────────────

  async function createAccount(payload: CreateAccountPayload): Promise<BankAccount> {
    const account = await financeApi.accounts.create({
      name: payload.name,
      type: payload.type,
      balance: payload.balance,
      currency: payload.currency ?? 'BRL',
      color: payload.color ?? '#3b82f6',
      icon: payload.icon ?? null,
      is_active: payload.is_active ?? true,
    })
    accounts.value.push(account)
    return account
  }

  async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<BankAccount> {
    const updated = await financeApi.accounts.update(id, payload)
    const idx = accounts.value.findIndex((a) => a.id === id)
    if (idx !== -1) accounts.value[idx] = updated
    return updated
  }

  async function deleteAccount(id: string): Promise<void> {
    await financeApi.accounts.delete(id)
    accounts.value = accounts.value.filter((a) => a.id !== id)
  }

  // ── Cards CRUD ───────────────────────────────────────────────────────────

  async function createCard(payload: CreateCreditCardPayload): Promise<CreditCard> {
    const card = await financeApi.cards.create({
      name: payload.name,
      network: payload.network,
      credit_limit: payload.credit_limit,
      current_balance: payload.current_balance ?? 0,
      closing_day: payload.closing_day,
      due_day: payload.due_day,
      color: payload.color ?? '#8b5cf6',
      is_active: payload.is_active ?? true,
    })
    cards.value.push(card)
    return card
  }

  async function updateCard(id: string, payload: UpdateCreditCardPayload): Promise<CreditCard> {
    const updated = await financeApi.cards.update(id, payload)
    const idx = cards.value.findIndex((c) => c.id === id)
    if (idx !== -1) cards.value[idx] = updated
    return updated
  }

  async function deleteCard(id: string): Promise<void> {
    await financeApi.cards.delete(id)
    cards.value = cards.value.filter((c) => c.id !== id)
  }

  return {
    accounts,
    cards,
    transactions,
    categories,
    loading,
    error,
    activeAccounts,
    activeCards,
    fetchAccounts,
    fetchCards,
    fetchTransactions,
    fetchCategories,
    fetchAll,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createAccount,
    updateAccount,
    deleteAccount,
    createCard,
    updateCard,
    deleteCard,
  }
})
