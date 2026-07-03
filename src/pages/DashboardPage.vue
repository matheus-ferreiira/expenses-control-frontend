<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { AppPageContainer } from '@/components/shared'
import DashboardSummaryCards from '@/features/dashboard/components/DashboardSummaryCards.vue'
import TodayTasksCard from '@/features/dashboard/components/TodayTasksCard.vue'
import HabitsOverviewCard from '@/features/dashboard/components/HabitsOverviewCard.vue'
import DashboardCashflowCard from '@/features/dashboard/components/DashboardCashflowCard.vue'
import DashboardTransactionsCard from '@/features/dashboard/components/DashboardTransactionsCard.vue'
import DashboardCalendarCard from '@/features/dashboard/components/DashboardCalendarCard.vue'
import DashboardBillsCard from '@/features/dashboard/components/DashboardBillsCard.vue'
import DashboardConsistencyCard from '@/features/dashboard/components/DashboardConsistencyCard.vue'
import DashboardGoalsProgressCard from '@/features/dashboard/components/DashboardGoalsProgressCard.vue'
import { useDashboard } from '@/features/dashboard/composables/useDashboard'
import { useToast } from '@/composables/useToast'
import { useGoalStore } from '@/stores/goals'
import { formatDate } from '@/utils/date'

const dashboard = useDashboard()
const toast = useToast()
const goalStore = useGoalStore()
const activeGoals = computed(() => goalStore.goals.filter((g) => g.status === 'active'))

const todayRaw = formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })
const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1)
const greeting = computed(() => dashboard.greeting())
const greetingContext = computed(() => dashboard.greetingContext())
const userName = computed(() => dashboard.userName.value)

async function handleToggleTask(id: string) {
  try {
    await dashboard.taskStore.toggleComplete(id)
  } catch {
    toast.error('Erro ao atualizar tarefa')
  }
}

async function handleLogHabit(id: string) {
  try {
    await dashboard.habitStore.optimisticLog(id)
  } catch {
    toast.error('Erro ao registrar hábito')
  }
}

onMounted(async () => {
  try {
    await Promise.all([dashboard.load(), goalStore.fetchGoals()])
  } catch {
    toast.error('Erro ao carregar dashboard')
  }
})
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="mb-5">
      <p
        class="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5 select-none"
        style="color: hsl(var(--muted-foreground) / 0.4)"
      >
        Hoje
      </p>
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div class="min-w-0">
          <h1 class="text-[22px] font-semibold text-foreground tracking-tight leading-tight">
            {{ today }}
          </h1>
          <p class="mt-0.5 text-[13px] text-muted-foreground">
            <span class="capitalize">{{ greeting }}, {{ userName || 'Olá' }}.</span>
            {{ greetingContext }}
          </p>
        </div>

      </div>
    </div>

    <!-- Summary cards -->
    <DashboardSummaryCards
      :pending-today="dashboard.pendingToday.value.length"
      :completed-today="dashboard.completedToday.value.length"
      :habits-completed="dashboard.completedHabitsToday.value.length"
      :habits-total="dashboard.activeHabits.value.length"
      :best-streak="dashboard.bestStreak.value"
      :best-streak-habit-name="dashboard.bestStreakHabit.value?.name"
      :total-balance="dashboard.totalBalance.value"
      :month-expenses="dashboard.monthExpenses.value"
      :month-income="dashboard.monthIncome.value"
      :loading="dashboard.loading.value"
      class="mb-5"
    />

    <!-- Main grid: 2/3 main + 1/3 sidebar -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- Main column -->
      <div class="xl:col-span-2 flex flex-col gap-4">
        <TodayTasksCard
          :tasks="dashboard.todayTasks.value"
          :loading="dashboard.loading.value"
          @toggle="handleToggleTask"
        />

        <DashboardCashflowCard
          :transactions="dashboard.recentTransactions.value"
          :compute-cashflow="dashboard.computeCashflow"
          :loading="dashboard.loading.value"
        />

        <DashboardTransactionsCard
          :transactions="dashboard.recentTransactions.value"
          :loading="dashboard.loading.value"
        />
      </div>

      <!-- Right sidebar -->
      <div class="flex flex-col gap-3">
        <DashboardCalendarCard
          :events="dashboard.todayEvents.value"
          :loading="dashboard.loading.value"
        />

        <HabitsOverviewCard
          :habits="dashboard.activeHabits.value"
          :loading="dashboard.loading.value"
          @log="handleLogHabit"
        />

        <DashboardConsistencyCard
          :habits="dashboard.activeHabits.value"
          :loading="dashboard.loading.value"
        />

        <DashboardGoalsProgressCard
          :goals="activeGoals"
          :loading="dashboard.loading.value"
        />

        <DashboardBillsCard
          :bills="dashboard.upcomingBills.value"
          :loading="dashboard.loading.value"
        />
      </div>
    </div>
  </AppPageContainer>
</template>
