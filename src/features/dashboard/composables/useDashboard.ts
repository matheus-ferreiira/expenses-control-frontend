import { computed, ref } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useHabitStore } from '@/stores/habits'
import { useFinanceStore } from '@/stores/finance'
import { useCalendarStore } from '@/stores/calendar'
import { useAuthStore } from '@/stores/auth'
import { financeApi } from '@/services/api/finance'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { isToday, toISODate } from '@/utils/date'
import { cycleLabel, daysUntil } from '@/features/finance/utils/financeHelpers'
import type { Transaction } from '@/types/finance'
import type { UpcomingBill } from '../types'

export function useDashboard() {
  const taskStore = useTaskStore()
  const habitStore = useHabitStore()
  const financeStore = useFinanceStore()
  const calendarStore = useCalendarStore()
  const authStore = useAuthStore()

  // Use a dedicated loading flag so parallel fetches (fetchAccounts + fetchTransactions)
  // don't cause a premature loading=false while some data is still in-flight.
  const dashboardLoading = ref(false)
  const loading = computed(() => dashboardLoading.value)

  // Every financial number here comes from the backend, with the same economic policy as the reports
  // (D-11): the browser used to add raw amounts of up to 500 transactions, pending ones included.
  const recentTxs = ref<Transaction[]>([])
  const monthIncome = ref(0)
  const monthExpenses = ref(0)

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

  // Saldo disponível: caixinhas ficam à parte (reserveBalance)
  const totalBalance = computed(() => financeStore.availableBalance)
  const reserveBalance = computed(() => financeStore.reserveBalance)

  const recentTransactions = computed(() => recentTxs.value.filter((t) => t.type !== 'transfer').slice(0, 5))

  // ── Calendar ──────────────────────────────────────────────────────────────

  const todayEvents = computed(() => {
    const todayStr = toISODate(new Date())
    return calendarStore.events
      .filter((e) => e.start_date.startsWith(todayStr))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  })

  // ── Upcoming Bills (credit card due days) ─────────────────────────────────

  // Faturas fechadas ainda não quitadas, com o valor que falta pagar (backend).
  const upcomingBills = ref<UpcomingBill[]>([])

  async function loadUpcomingBills(): Promise<void> {
    const overviews = await Promise.all(
      financeStore.activeCards.map(async (card) => ({ card, overview: await financeApi.cards.overview(card.id) })),
    )
    upcomingBills.value = overviews
      .flatMap(({ card, overview }) =>
        overview.to_pay.map((s) => ({
          id: `${card.id}-${s.cycle}`,
          name: `Fatura ${card.name} · ${cycleLabel(s.cycle)}`,
          dueDate: s.due_on,
          amount: s.remaining_cents / 100,
          daysUntilDue: daysUntil(s.due_on, overview.today),
        })),
      )
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
  }

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
    const totalPending = pendingToday.value.length
    const habits = pendingHabitsToday.value.length
    const events = todayEvents.value.length

    if (urgent > 0) {
      parts.push(`${urgent} ${urgent === 1 ? 'tarefa prioritária' : 'tarefas prioritárias'}`)
    } else if (totalPending > 0) {
      parts.push(`${totalPending} ${totalPending === 1 ? 'tarefa' : 'tarefas'}`)
    }
    if (habits > 0) parts.push(`${habits} ${habits === 1 ? 'hábito' : 'hábitos'}`)
    if (events > 0) parts.push(`${events} ${events === 1 ? 'evento' : 'eventos'}`)

    if (parts.length === 0) return 'Tudo em dia por enquanto.'
    return `Você tem ${parts.join(', ')} hoje.`
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load(): Promise<void> {
    dashboardLoading.value = true
    try {
      const now = new Date()

      const monthFetch = financeApi
        .monthlyReport(now.getFullYear(), now.getMonth() + 1)
        .then((r) => {
          monthIncome.value = r.income
          monthExpenses.value = r.expenses
        })
        .catch(() => {})
      const recentFetch = financeApi.transactions
        .list({ status: 'confirmed', sort_by: 'transaction_date', sort_direction: 'desc', per_page: 10 })
        .then((res) => {
          recentTxs.value = res.data
        })
        .catch(() => {})
      await Promise.allSettled([
        taskStore.fetchTasks(),
        habitStore.fetchHabits(),
        financeStore.fetchAccounts(),
        financeStore.fetchCards().then(loadUpcomingBills).catch(() => { upcomingBills.value = [] }),
        monthFetch,
        recentFetch,
        calendarStore.fetchForMonth(now.getFullYear(), now.getMonth()),
      ])
    } finally {
      dashboardLoading.value = false
    }
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
    reserveBalance,
    monthIncome,
    monthExpenses,
    recentTransactions,
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
