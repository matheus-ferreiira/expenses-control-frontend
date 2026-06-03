import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { financeApi } from '@/services/api/finance'
import type {
  BankAccount,
  Budget,
  CreateBudgetDTO,
  CreateGoalDTO,
  CreditCard,
  FinanceGoal,
  Transaction,
  TransactionCategory,
  TransactionTag,
  TransactionFilters,
  UpdateBudgetDTO,
  UpdateGoalDTO,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from '@/types/finance'
import type {
  CreateAccountPayload,
  UpdateAccountPayload,
  CreateCreditCardPayload,
  UpdateCreditCardPayload,
} from '@/features/finance/types'
import type { PaginationMeta } from '@/types/api'

export const useFinanceStore = defineStore('finance', () => {
  const accounts = ref<BankAccount[]>([])
  const cards = ref<CreditCard[]>([])
  const transactions = ref<Transaction[]>([])
  /** Pagination meta from the last fetchTransactions call — includes total, per_page, etc. */
  const transactionsMeta = ref<PaginationMeta | null>(null)
  const categories = ref<TransactionCategory[]>([])
  const tags = ref<TransactionTag[]>([])
  const loadingAccounts = ref(false)
  const loadingCards = ref(false)
  const loadingTransactions = ref(false)
  const loadingCategories = ref(false)
  const loadingTags = ref(false)
  const currentBudget = ref<Budget | null>(null)
  const loadingBudget = ref(false)
  const goals = ref<FinanceGoal[]>([])
  const loadingGoals = ref(false)
  const loading = computed(
    () =>
      loadingAccounts.value ||
      loadingCards.value ||
      loadingTransactions.value ||
      loadingCategories.value ||
      loadingTags.value,
  )
  const error = ref<string | null>(null)

  const activeAccounts = computed(() => accounts.value.filter((a) => a.is_active))
  const archivedAccounts = computed(() => accounts.value.filter((a) => !a.is_active))
  const activeCards = computed(() => cards.value.filter((c) => c.is_active))
  const archivedCards = computed(() => cards.value.filter((c) => !c.is_active))

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchAccounts() {
    loadingAccounts.value = true
    try {
      accounts.value = await financeApi.accounts.list()
    } catch {
      error.value = 'Erro ao carregar contas'
    } finally {
      loadingAccounts.value = false
    }
  }

  async function fetchCards() {
    loadingCards.value = true
    try {
      cards.value = await financeApi.cards.list()
    } catch {
      error.value = 'Erro ao carregar cartões'
    } finally {
      loadingCards.value = false
    }
  }

  let _fetchTxVersion = 0

  async function fetchTransactions(filters?: TransactionFilters) {
    const version = ++_fetchTxVersion
    loadingTransactions.value = true
    error.value = null
    try {
      const result = await financeApi.transactions.list(filters)
      if (version !== _fetchTxVersion) return // superseded by a later call
      transactions.value = result.data
      transactionsMeta.value = result.meta
    } catch (e: unknown) {
      if (version === _fetchTxVersion) {
        error.value = 'Erro ao carregar transações'
        throw e
      }
    } finally {
      if (version === _fetchTxVersion) {
        loadingTransactions.value = false
      }
    }
  }

  async function fetchCategories() {
    loadingCategories.value = true
    try {
      categories.value = await financeApi.categories.list()
    } catch {
      error.value = 'Erro ao carregar categorias'
    } finally {
      loadingCategories.value = false
    }
  }

  async function fetchTags() {
    loadingTags.value = true
    try {
      tags.value = await financeApi.tags.list()
    } catch {
      error.value = 'Erro ao carregar tags'
    } finally {
      loadingTags.value = false
    }
  }

  async function fetchAll() {
    await Promise.all([fetchAccounts(), fetchCards(), fetchCategories(), fetchTags()])
  }

  // ── Transactions CRUD ────────────────────────────────────────────────────

  async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction | Transaction[]> {
    try {
      const result = await financeApi.transactions.create(payload)
      if (Array.isArray(result)) {
        transactions.value.unshift(...result)
      } else {
        transactions.value.unshift(result)
      }
      // Refresh account balances since backend adjusts them on transaction create
      fetchAccounts().catch(() => {})
      return result
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
      // Refresh account balances since backend may adjust them on transaction update
      fetchAccounts().catch(() => {})
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
      // Refresh account balances since backend reverses the balance on delete
      fetchAccounts().catch(() => {})
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

  async function createCategory(payload: Omit<TransactionCategory, 'id' | 'user_id' | 'created_at'>): Promise<TransactionCategory> {
    try {
      const created = await financeApi.categories.create(payload)
      categories.value.push(created)
      return created
    } catch (e: unknown) {
      error.value = 'Erro ao criar categoria'
      throw e
    }
  }

  async function updateCategory(id: string, payload: Partial<TransactionCategory>): Promise<TransactionCategory> {
    try {
      const updated = await financeApi.categories.update(id, payload)
      const idx = categories.value.findIndex((c) => c.id === id)
      if (idx !== -1) categories.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = 'Erro ao atualizar categoria'
      throw e
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    try {
      await financeApi.categories.delete(id)
      categories.value = categories.value.filter((c) => c.id !== id)
    } catch (e: unknown) {
      error.value = 'Erro ao excluir categoria'
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

  // ── Budget ───────────────────────────────────────────────────────────────

  async function fetchBudget(month: number, year: number) {
    loadingBudget.value = true
    try {
      currentBudget.value = await financeApi.budgets.get(month, year)
    } catch {
      currentBudget.value = null
    } finally {
      loadingBudget.value = false
    }
  }

  async function createBudget(data: CreateBudgetDTO): Promise<Budget> {
    const created = await financeApi.budgets.create(data)
    currentBudget.value = created
    return created
  }

  async function updateBudget(id: string, data: UpdateBudgetDTO): Promise<Budget> {
    const updated = await financeApi.budgets.update(id, data)
    currentBudget.value = updated
    return updated
  }

  async function deleteBudget(id: string): Promise<void> {
    await financeApi.budgets.delete(id)
    currentBudget.value = null
  }

  // ── Finance Goals ─────────────────────────────────────────────────────────

  async function fetchGoals() {
    loadingGoals.value = true
    try {
      goals.value = await financeApi.goals.list()
    } finally {
      loadingGoals.value = false
    }
  }

  async function createGoal(data: CreateGoalDTO): Promise<FinanceGoal & { create_recurring_transaction: boolean }> {
    const created = await financeApi.goals.create(data)
    goals.value.unshift(created)
    return created
  }

  async function updateGoal(id: string, data: UpdateGoalDTO): Promise<FinanceGoal> {
    const updated = await financeApi.goals.update(id, data)
    const idx = goals.value.findIndex((g) => g.id === id)
    if (idx !== -1) goals.value[idx] = updated
    return updated
  }

  async function completeGoal(id: string): Promise<FinanceGoal> {
    const updated = await financeApi.goals.complete(id)
    const idx = goals.value.findIndex((g) => g.id === id)
    if (idx !== -1) goals.value[idx] = updated
    return updated
  }

  async function deleteGoal(id: string): Promise<void> {
    await financeApi.goals.delete(id)
    goals.value = goals.value.filter((g) => g.id !== id)
  }

  function resetState(): void {
    accounts.value = []
    cards.value = []
    transactions.value = []
    transactionsMeta.value = null
    categories.value = []
    tags.value = []
    currentBudget.value = null
    goals.value = []
    loadingAccounts.value = false
    loadingCards.value = false
    loadingTransactions.value = false
    loadingCategories.value = false
    loadingTags.value = false
    loadingBudget.value = false
    loadingGoals.value = false
    error.value = null
    _fetchTxVersion = 0
  }

  return {
    accounts,
    cards,
    transactions,
    transactionsMeta,
    categories,
    loading,
    error,
    activeAccounts,
    archivedAccounts,
    activeCards,
    archivedCards,
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
    createCategory,
    updateCategory,
    deleteCategory,
    createAccount,
    updateAccount,
    deleteAccount,
    createCard,
    updateCard,
    deleteCard,
    currentBudget,
    loadingBudget,
    fetchBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    goals,
    loadingGoals,
    fetchGoals,
    createGoal,
    updateGoal,
    completeGoal,
    deleteGoal,
    resetState,
  }
})
