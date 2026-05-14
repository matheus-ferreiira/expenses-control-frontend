import { computed, ref } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useHabitStore } from '@/stores/habits'
import { useFinanceStore } from '@/stores/finance'
import { useCalendarStore } from '@/stores/calendar'
import { useAuthStore } from '@/stores/auth'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { isToday, toISODate } from '@/utils/date'
import type { CashflowPeriod, CashflowPoint, UpcomingBill } from '../types'

export function useDashboard() {
  const taskStore = useTaskStore()
  const habitStore = useHabitStore()
  const financeStore = useFinanceStore()
  const calendarStore = useCalendarStore()
  const authStore = useAuthStore()

  const loading = computed(
    () => taskStore.loading || habitStore.loading || financeStore.loading,
  )

  // ── Auth ─────────────────────────────────────────────────────────────────

  const userName = computed(() => {
    const name = authStore.user?.name ?? ''
    return name.split(' ')[0] ?? name
  })

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const todayTasks = computed(() =>
    taskStore.tasks
      .filter(
        (t) =>
          t.due_date &&
          isToday(t.due_date) &&
          t.status !== 'cancelled' &&
          !t.is_archived,
      )
      .sort((a, b) => {
        const aOrder = a.status === 'completed' ? 1 : 0
        const bOrder = b.status === 'completed' ? 1 : 0
        return aOrder - bOrder
      }),
  )

  const pendingToday = computed(() =>
    todayTasks.value.filter((t) => t.status !== 'completed'),
  )

  const completedToday = computed(() =>
    todayTasks.value.filter((t) => t.status === 'completed'),
  )

  const urgentTasks = computed(() =>
    pendingToday.value.filter(
      (t) => t.priority === 'urgent' || t.priority === 'high',
    ),
  )

  const overdueTasks = computed(() => taskStore.overdueTasks)

  // ── Habits ────────────────────────────────────────────────────────────────

  const activeHabits = computed(() => habitStore.habits.filter((h) => h.is_active))

  const completedHabitsToday = computed(() =>
    activeHabits.value.filter((h) => isCompletedToday(h)),
  )

  const bestStreak = computed(() =>
    activeHabits.value.reduce((max, h) => Math.max(max, h.current_streak), 0),
  )

  const bestStreakHabit = computed(() =>
    activeHabits.value.reduce(
      (best, h) => (h.current_streak > (best?.current_streak ?? -1) ? h : best),
      null as (typeof activeHabits.value)[0] | null,
    ),
  )

  const pendingHabitsToday = computed(() =>
    activeHabits.value.filter((h) => !isCompletedToday(h)),
  )

  // ── Finance ───────────────────────────────────────────────────────────────

  const totalBalance = computed(() =>
    financeStore.activeAccounts.reduce((sum, a) => sum + a.balance, 0),
  )

  const monthTransactions = computed(() => {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    return financeStore.transactions.filter((t) => t.transaction_date >= monthStart && t.type !== 'transfer')
  })

  const monthIncome = computed(() =>
    monthTransactions.value
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
  )

  const monthExpenses = computed(() =>
    monthTransactions.value
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  )

  const recentTransactions = computed(() =>
    [...financeStore.transactions]
      .filter((t) => t.type !== 'transfer')
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      .slice(0, 5),
  )

  function computeCashflow(period: CashflowPeriod): CashflowPoint[] {
    const now = new Date()
    const txs = financeStore.transactions.filter((t) => t.type !== 'transfer')

    if (period === '1S') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - 6 + i)
        const dateStr = toISODate(d)
        const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
        const dayTxs = txs.filter((t) => t.transaction_date === dateStr)
        const income = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return { label, income, expense, net: income - expense }
      })
    }

    if (period === '1M') {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - 29 + i)
        const dateStr = toISODate(d)
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
        const dayTxs = txs.filter((t) => t.transaction_date === dateStr)
        const income = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return { label, income, expense, net: income - expense }
      })
    }

    const months = period === '6M' ? 6 : 12
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const monthTxs = txs.filter((t) => t.transaction_date.startsWith(prefix))
      const income = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { label, income, expense, net: income - expense }
    })
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  const todayEvents = computed(() => {
    const todayStr = toISODate(new Date())
    return calendarStore.events
      .filter((e) => e.start_date.startsWith(todayStr))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  })

  // ── Upcoming Bills (credit card due days) ─────────────────────────────────

  const upcomingBills = computed((): UpcomingBill[] => {
    const today = new Date()
    const todayDay = today.getDate()
    const LOOKAHEAD = 10

    return financeStore.activeCards
      .map((card) => {
        let daysUntilDue = card.due_day - todayDay
        if (daysUntilDue < 0) daysUntilDue += 30
        const dueDate = new Date(today)
        dueDate.setDate(today.getDate() + daysUntilDue)
        return {
          id: card.id,
          name: card.name,
          dueDate: toISODate(dueDate),
          amount: card.limit_amount,
          daysUntilDue,
        }
      })
      .filter((b) => b.daysUntilDue <= LOOKAHEAD)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
  })

  // ── Greeting ──────────────────────────────────────────────────────────────

  function greeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  function greetingContext(): string {
    const parts: string[] = []
    const urgent = urgentTasks.value.length
    const pending = pendingHabitsToday.value.length
    if (urgent > 0)
      parts.push(`${urgent} ${urgent === 1 ? 'tarefa prioritária' : 'tarefas prioritárias'}`)
    if (pending > 0)
      parts.push(`${pending} ${pending === 1 ? 'hábito pendente' : 'hábitos pendentes'}`)
    if (parts.length === 0) return 'Tudo em dia por enquanto.'
    return `Você tem ${parts.join(' e ')}.`
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  const cashflowPeriod = ref<CashflowPeriod>('1M')

  async function load(): Promise<void> {
    const now = new Date()
    const yearAgo = new Date(now)
    yearAgo.setFullYear(now.getFullYear() - 1)

    await Promise.allSettled([
      taskStore.fetchTasks(),
      habitStore.fetchHabits(),
      financeStore.fetchAccounts(),
      financeStore.fetchCards(),
      financeStore.fetchTransactions({
        start_date: toISODate(yearAgo),
        end_date: toISODate(now),
        per_page: 500,
      }),
      calendarStore.fetchForMonth(now.getFullYear(), now.getMonth()),
    ])
  }

  return {
    loading,
    userName,
    // tasks
    todayTasks,
    pendingToday,
    completedToday,
    urgentTasks,
    overdueTasks,
    // habits
    activeHabits,
    completedHabitsToday,
    bestStreak,
    bestStreakHabit,
    pendingHabitsToday,
    // finance
    totalBalance,
    monthIncome,
    monthExpenses,
    recentTransactions,
    computeCashflow,
    cashflowPeriod,
    // calendar
    todayEvents,
    // bills
    upcomingBills,
    // utils
    greeting,
    greetingContext,
    load,
    taskStore,
    habitStore,
  }
}
