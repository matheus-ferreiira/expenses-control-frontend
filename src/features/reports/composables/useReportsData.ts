import { ref, computed } from 'vue'
import { reportsApi } from '@/services/api/reports'
import { tasksApi } from '@/services/api/tasks'
import { useHabitStore } from '@/stores/habits'
import { useGoalStore } from '@/stores/goals'
import { useFinanceStore } from '@/stores/finance'
import type { ReportPeriod } from '@/types/reports'
import type { YearlySummary } from '@/types/reports'
import type { Task } from '@/types/tasks'

export function useReportsData() {
  const period = ref<ReportPeriod>('30d')
  const loading = ref(false)
  const yearlyFinance = ref<YearlySummary | null>(null)
  const completedTasks = ref<Task[]>([])

  const habitStore = useHabitStore()
  const goalStore = useGoalStore()
  const financeStore = useFinanceStore()

  // Date range from period
  const startDate = computed(() => {
    const d = new Date()
    if (period.value === '7d') d.setDate(d.getDate() - 7)
    else if (period.value === '30d') d.setDate(d.getDate() - 30)
    else if (period.value === '90d') d.setDate(d.getDate() - 90)
    else d.setFullYear(d.getFullYear() - 1)
    return d.toLocaleDateString('en-CA')
  })

  // ── Stats ────────────────────────────────────────────────────────────────

  const tasksCompletedCount = computed(() =>
    completedTasks.value.filter(
      (t) => t.completed_at && t.completed_at.slice(0, 10) >= startDate.value,
    ).length,
  )

  const habitsLoggedCount = computed(() =>
    habitStore.habits.reduce(
      (sum, h) => sum + h.logs.filter((l) => l.completed_date >= startDate.value).length,
      0,
    ),
  )

  const financeNet = computed(() => {
    const txns = financeStore.transactions.filter((t) => t.transaction_date >= startDate.value)
    const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return income - expenses
  })

  const activeGoalsCount = computed(() => goalStore.goals.filter((g) => g.status === 'active').length)

  // ── Productivity chart data (tasks by period bucket) ─────────────────────

  const productivityChartData = computed(() => {
    const tasks = completedTasks.value.filter(
      (t) => t.completed_at && t.completed_at.slice(0, 10) >= startDate.value,
    )
    const now = new Date()

    if (period.value === '7d') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (6 - i))
        const key = d.toLocaleDateString('en-CA')
        return {
          label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          value: tasks.filter((t) => t.completed_at!.slice(0, 10) === key).length,
        }
      })
    }

    if (period.value === '30d') {
      // Weekly buckets — last 4 weeks
      return Array.from({ length: 4 }, (_, i) => {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() - i * 7)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)
        const ws = weekStart.toLocaleDateString('en-CA')
        const we = weekEnd.toLocaleDateString('en-CA')
        return {
          label: weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: tasks.filter((t) => {
            const d = t.completed_at!.slice(0, 10)
            return d >= ws && d <= we
          }).length,
        }
      }).reverse()
    }

    if (period.value === '90d') {
      // Weekly buckets — last 12 weeks
      return Array.from({ length: 12 }, (_, i) => {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() - i * 7)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)
        const ws = weekStart.toLocaleDateString('en-CA')
        const we = weekEnd.toLocaleDateString('en-CA')
        return {
          label: weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: tasks.filter((t) => {
            const d = t.completed_at!.slice(0, 10)
            return d >= ws && d <= we
          }).length,
        }
      }).reverse()
    }

    // 1y: monthly
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const ym = d.toLocaleDateString('en-CA').slice(0, 7)
      return {
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        value: tasks.filter((t) => t.completed_at!.slice(0, 7) === ym).length,
      }
    })
  })

  // ── Habits trend chart data (daily completion rate) ───────────────────────

  const habitsTrendData = computed(() => {
    const activeHabits = habitStore.habits.filter((h) => h.is_active)
    const total = activeHabits.length
    if (total === 0) return []

    const now = new Date()
    const days = period.value === '7d' ? 7 : period.value === '30d' ? 30 : period.value === '90d' ? 90 : 365

    return Array.from({ length: Math.min(days, 90) }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (Math.min(days, 90) - 1 - i))
      const key = d.toLocaleDateString('en-CA')
      const completed = activeHabits.filter((h) => h.logs.some((l) => l.completed_date === key)).length
      return {
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: Math.round((completed / total) * 100),
      }
    })
  })

  // ── Summary panel insights ────────────────────────────────────────────────

  const bestStreak = computed(() => {
    const best = habitStore.habits.reduce(
      (max, h) => (h.current_streak > max.streak ? { streak: h.current_streak, name: h.name } : max),
      { streak: 0, name: '' },
    )
    return best.streak > 0 ? best : null
  })

  const mostConsistentHabit = computed(() => {
    if (!habitStore.habits.length) return null
    const best = habitStore.habits
      .filter((h) => h.is_active)
      .reduce(
        (best, h) => {
          const logs = h.logs.filter((l) => l.completed_date >= startDate.value).length
          return logs > best.count ? { count: logs, name: h.name, color: h.color } : best
        },
        { count: 0, name: '', color: null as string | null },
      )
    return best.count > 0 ? best : null
  })

  const topExpenseCategory = computed(() => {
    const expenses = financeStore.transactions.filter(
      (t) => t.type === 'expense' && t.transaction_date >= startDate.value,
    )
    const byCategory: Record<string, { name: string; total: number }> = {}
    for (const t of expenses) {
      const name = t.category?.name ?? 'Sem categoria'
      if (!byCategory[name]) byCategory[name] = { name, total: 0 }
      byCategory[name].total += t.amount
    }
    const entries = Object.values(byCategory)
    if (!entries.length) return null
    return entries.reduce((max, c) => (c.total > max.total ? c : max))
  })

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    loading.value = true
    try {
      await Promise.all([
        habitStore.habits.length ? Promise.resolve() : habitStore.fetchHabits(),
        goalStore.goals.length ? Promise.resolve() : goalStore.fetchGoals(),
        financeStore.transactions.length
          ? Promise.resolve()
          : financeStore.fetchTransactions({ per_page: 500 }),
      ])

      const [tasksResult, yearly] = await Promise.all([
        tasksApi.list({ status: 'completed', per_page: 500 }),
        reportsApi.yearlyFinance(new Date().getFullYear()),
      ])

      completedTasks.value = tasksResult.data
      yearlyFinance.value = yearly
    } catch {
      // non-fatal — components will show empty state
    } finally {
      loading.value = false
    }
  }

  return {
    period,
    loading,
    yearlyFinance,
    tasksCompletedCount,
    habitsLoggedCount,
    financeNet,
    activeGoalsCount,
    productivityChartData,
    habitsTrendData,
    bestStreak,
    mostConsistentHabit,
    topExpenseCategory,
    load,
  }
}
