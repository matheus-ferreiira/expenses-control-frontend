import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { financeApi } from '@/services/api/finance'
import type {
  BankAccount,
  CreditCard,
  Transaction,
  TransactionCategory,
  TransactionTag,
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
  const tags = ref<TransactionTag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeAccounts = computed(() => accounts.value.filter((a) => a.is_active))
  const activeCards = computed(() => cards.value.filter((c) => c.is_active))

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchAccounts() {
    loading.value = true
    try {
      accounts.value = await financeApi.accounts.list()
    } catch {
      error.value = 'Erro ao carregar contas'
    } finally {
      loading.value = false
    }
  }

  async function fetchCards() {
    loading.value = true
    try {
      cards.value = await financeApi.cards.list()
    } catch {
      error.value = 'Erro ao carregar cartões'
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactions(filters?: TransactionFilters) {
    loading.value = true
    error.value = null
    try {
      const result = await financeApi.transactions.list(filters)
      transactions.value = result.data
    } catch (e: unknown) {
      error.value = 'Erro ao carregar transações'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    loading.value = true
    try {
      categories.value = await financeApi.categories.list()
    } catch {
      error.value = 'Erro ao carregar categorias'
    } finally {
      loading.value = false
    }
  }

  async function fetchTags() {
    try {
      tags.value = await financeApi.tags.list()
    } catch {
      error.value = 'Erro ao carregar tags'
    }
  }

  async function fetchAll() {
    await Promise.all([fetchAccounts(), fetchCards(), fetchCategories(), fetchTags()])
  }

  // ── Transactions CRUD ────────────────────────────────────────────────────

  async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    try {
      const t = await financeApi.transactions.create(payload)
      transactions.value.unshift(t)
      return t
    } catch (e: unknown) {
      error.value = 'Erro ao criar transação'
      throw e
    }
  }

  async function updateTransaction(
    id: string,
    payload: UpdateTransactionPayload,
  ): Promise<Transaction> {
    try {
      const updated = await financeApi.transactions.update(id, payload)
      const idx = transactions.value.findIndex((t) => t.id === id)
      if (idx !== -1) transactions.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar transação'
      throw e
    }
  }

  async function deleteTransaction(id: string): Promise<void> {
    try {
      await financeApi.transactions.delete(id)
      transactions.value = transactions.value.filter((t) => t.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir transação'
      throw e
    }
  }

  /** Remove all locally-cached transactions belonging to a recurrence group (called after cascade delete). */
  function removeTransactionGroup(groupId: string): void {
    transactions.value = transactions.value.filter((t) => t.recurrence_group_id !== groupId)
  }

  // ── Tags CRUD ────────────────────────────────────────────────────────────

  async function createTag(payload: Pick<TransactionTag, 'name' | 'color'>): Promise<TransactionTag> {
    try {
      const tag = await financeApi.tags.create(payload)
      tags.value.push(tag)
      return tag
    } catch (e: unknown) {
      error.value = 'Erro ao criar tag'
      throw e
    }
  }

  async function updateTag(id: string, payload: Partial<Pick<TransactionTag, 'name' | 'color'>>): Promise<TransactionTag> {
    try {
      const updated = await financeApi.tags.update(id, payload)
      const idx = tags.value.findIndex((t) => t.id === id)
      if (idx !== -1) tags.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar tag'
      throw e
    }
  }

  async function deleteTag(id: string): Promise<void> {
    try {
      await financeApi.tags.delete(id)
      tags.value = tags.value.filter((t) => t.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir tag'
      throw e
    }
  }

  // ── Accounts CRUD ────────────────────────────────────────────────────────

  async function createAccount(payload: CreateAccountPayload): Promise<BankAccount> {
    try {
      const account = await financeApi.accounts.create({
        name: payload.name,
        bank_name: payload.bank_name ?? null,
        type: payload.type,
        balance: payload.balance,
        currency: payload.currency ?? 'BRL',
        color: payload.color ?? '#3b82f6',
        is_active: payload.is_active ?? true,
      })
      accounts.value.push(account)
      return account
    } catch (e: unknown) {
      error.value = 'Erro ao criar conta'
      throw e
    }
  }

  async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<BankAccount> {
    try {
      const updated = await financeApi.accounts.update(id, payload)
      const idx = accounts.value.findIndex((a) => a.id === id)
      if (idx !== -1) accounts.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar conta'
      throw e
    }
  }

  async function deleteAccount(id: string): Promise<void> {
    try {
      await financeApi.accounts.delete(id)
      accounts.value = accounts.value.filter((a) => a.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir conta'
      throw e
    }
  }

  // ── Cards CRUD ───────────────────────────────────────────────────────────

  async function createCard(payload: CreateCreditCardPayload): Promise<CreditCard> {
    try {
      const card = await financeApi.cards.create({
        bank_account_id: payload.bank_account_id ?? null,
        name: payload.name,
        limit_amount: payload.limit_amount,
        closing_day: payload.closing_day,
        due_day: payload.due_day,
        color: payload.color ?? '#8b5cf6',
        is_active: payload.is_active ?? true,
      })
      cards.value.push(card)
      return card
    } catch (e: unknown) {
      error.value = 'Erro ao criar cartão'
      throw e
    }
  }

  async function updateCard(id: string, payload: UpdateCreditCardPayload): Promise<CreditCard> {
    try {
      const updated = await financeApi.cards.update(id, payload)
      const idx = cards.value.findIndex((c) => c.id === id)
      if (idx !== -1) cards.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar cartão'
      throw e
    }
  }

  async function deleteCard(id: string): Promise<void> {
    try {
      await financeApi.cards.delete(id)
      cards.value = cards.value.filter((c) => c.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir cartão'
      throw e
    }
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
    removeTransactionGroup,
    tags,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    createAccount,
    updateAccount,
    deleteAccount,
    createCard,
    updateCard,
    deleteCard,
  }
})
