<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { AppPageContainer } from '@/components/shared'
import DashboardSummaryCards from '@/features/dashboard/components/DashboardSummaryCards.vue'
import TodayTasksCard from '@/features/dashboard/components/TodayTasksCard.vue'
import HabitsOverviewCard from '@/features/dashboard/components/HabitsOverviewCard.vue'
import QuickActionsCard from '@/features/dashboard/components/QuickActionsCard.vue'
import { useDashboard } from '@/features/dashboard/composables/useDashboard'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/date'

const dashboard = useDashboard()
const toast = useToast()

const today = formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })
const greeting = computed(() => dashboard.greeting())

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

onMounted(() => {
  dashboard.load()
})
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="mb-6">
      <p class="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5 select-none" style="color: hsl(var(--muted-foreground) / 0.4)">Hoje</p>
      <h1 class="text-[22px] font-semibold text-foreground tracking-tight leading-tight capitalize">
        {{ today }}
      </h1>
      <p class="mt-1 text-[13px] text-muted-foreground/60 capitalize">{{ greeting }}</p>
    </div>

    <!-- Summary cards -->
    <DashboardSummaryCards
      :pending-today="dashboard.pendingToday.value.length"
      :completed-today="dashboard.completedToday.value.length"
      :habits-completed="dashboard.completedHabitsToday.value.length"
      :habits-total="dashboard.activeHabits.value.length"
      :best-streak="dashboard.bestStreak.value"
      :loading="dashboard.loading.value"
      class="mb-4"
    />

    <!-- Main grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <!-- Today's tasks — takes 2 cols on desktop -->
      <div class="lg:col-span-2">
        <TodayTasksCard
          :tasks="dashboard.todayTasks.value"
          :loading="dashboard.loading.value"
          @toggle="handleToggleTask"
        />
      </div>

      <!-- Habits overview -->
      <div>
        <HabitsOverviewCard
          :habits="dashboard.activeHabits.value"
          :loading="dashboard.loading.value"
          @log="handleLogHabit"
        />
      </div>
    </div>

    <!-- Quick actions -->
    <QuickActionsCard />
  </AppPageContainer>
</template>
