import { computed } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useHabitStore } from '@/stores/habits'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import { isToday } from '@/utils/date'

export function useDashboard() {
  const taskStore = useTaskStore()
  const habitStore = useHabitStore()

  const loading = computed(() => taskStore.loading || habitStore.loading)

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
        // Pending/in_progress first, completed last
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

  const activeHabits = computed(() => habitStore.habits.filter((h) => h.is_active))

  const completedHabitsToday = computed(() =>
    activeHabits.value.filter((h) => isCompletedToday(h)),
  )

  const bestStreak = computed(() =>
    activeHabits.value.reduce((max, h) => Math.max(max, h.current_streak), 0),
  )

  function greeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  async function load(): Promise<void> {
    await Promise.all([taskStore.fetchTasks(), habitStore.fetchHabits()])
  }

  return {
    loading,
    todayTasks,
    pendingToday,
    completedToday,
    activeHabits,
    completedHabitsToday,
    bestStreak,
    greeting,
    load,
    taskStore,
    habitStore,
  }
}
