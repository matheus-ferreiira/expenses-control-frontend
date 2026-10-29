<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { AppPageContainer } from '@/components/shared'
import DashboardFinanceCard from '@/features/dashboard/components/DashboardFinanceCard.vue'
import TodayTasksCard from '@/features/dashboard/components/TodayTasksCard.vue'
import HabitsOverviewCard from '@/features/dashboard/components/HabitsOverviewCard.vue'
import DashboardTransactionsCard from '@/features/dashboard/components/DashboardTransactionsCard.vue'
import DashboardCalendarCard from '@/features/dashboard/components/DashboardCalendarCard.vue'
import DashboardBillsCard from '@/features/dashboard/components/DashboardBillsCard.vue'
import DashboardConsistencyCard from '@/features/dashboard/components/DashboardConsistencyCard.vue'
import DashboardGoalsProgressCard from '@/features/dashboard/components/DashboardGoalsProgressCard.vue'
import { useDashboard } from '@/features/dashboard/composables/useDashboard'
import { useToast } from '@/composables/useToast'
import { useFinanceStore } from '@/stores/finance'
import { formatDate } from '@/utils/date'

const dashboard = useDashboard()
const toast = useToast()
const financeStore = useFinanceStore()
const activeGoals = computed(() => financeStore.goals.filter((g) => g.status === 'active'))

const todayRaw = formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })
const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1)
// "Boa tarde": the class `capitalize` used to turn it into "Boa Tarde"
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
    await Promise.all([dashboard.load(), financeStore.fetchGoals()])
  } catch {
    toast.error('Erro ao carregar dashboard')
  }
})
</script>

<template>
  <AppPageContainer>
    <!-- Header: the date is the title; solid text colours (the label used to be translucent) -->
    <div class="mb-5">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 select-none">Hoje</p>
      <h1 class="text-[22px] font-semibold text-foreground tracking-tight leading-tight">{{ today }}</h1>
      <p class="mt-0.5 text-[13px] text-muted-foreground">
        {{ greeting }}, {{ userName || 'olá' }}. {{ greetingContext }}
      </p>
    </div>

    <!-- Visão Geral grid: summary cards on the left, the day's lists on the right -->
    <div class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="space-y-3 mb-3 lg:mb-0">
        <DashboardFinanceCard
          :available="dashboard.totalBalance.value"
          :reserve="dashboard.reserveBalance.value"
          :month-income="dashboard.monthIncome.value"
          :month-expenses="dashboard.monthExpenses.value"
          :loading="dashboard.loading.value"
        />

        <DashboardBillsCard
          :bills="dashboard.upcomingBills.value"
          :loading="dashboard.loading.value"
        />

        <DashboardGoalsProgressCard
          :goals="activeGoals"
          :loading="dashboard.loading.value"
        />
      </div>

      <div class="space-y-3">
        <TodayTasksCard
          :tasks="dashboard.todayTasks.value"
          :loading="dashboard.loading.value"
          @toggle="handleToggleTask"
        />

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

        <DashboardTransactionsCard
          :transactions="dashboard.recentTransactions.value"
          :loading="dashboard.loading.value"
        />
      </div>
    </div>
  </AppPageContainer>
</template>
