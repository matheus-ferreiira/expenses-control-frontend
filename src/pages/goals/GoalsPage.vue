<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import GoalsSummary from '@/features/goals/components/GoalsSummary.vue'
import GoalGroup from '@/features/goals/components/GoalGroup.vue'
import { useGoalStore } from '@/stores/goals'
import { useToast } from '@/composables/useToast'
import { GOAL_TYPE_GROUP_LABELS, GOAL_TYPE_ORDER } from '@/types/goals'
import type { Goal, GoalType } from '@/types/goals'

const store = useGoalStore()
const toast = useToast()

// Stats computed from all goals
const activeGoals = computed(() => store.goals.filter((g) => g.status === 'active'))
const completedGoals = computed(() => store.goals.filter((g) => g.status === 'completed'))
const overdueGoals = computed(() => store.goals.filter((g) => g.is_overdue))

const averageProgress = computed(() => {
  if (!activeGoals.value.length) return 0
  const sum = activeGoals.value.reduce((acc, g) => acc + g.progress_percentage, 0)
  return Math.round(sum / activeGoals.value.length)
})

// Visible goals: active + completed (not cancelled/paused)
const visibleGoals = computed(() =>
  store.goals.filter((g) => g.status === 'active' || g.status === 'completed'),
)

// Grouped by type (only non-empty groups, in canonical order)
const groups = computed(() => {
  const result: { type: GoalType; label: string; goals: Goal[] }[] = []
  for (const type of GOAL_TYPE_ORDER) {
    const typeGoals = visibleGoals.value.filter((g) => g.type === type)
    if (typeGoals.length > 0) {
      result.push({ type, label: GOAL_TYPE_GROUP_LABELS[type], goals: typeGoals })
    }
  }
  return result
})

async function handleDelete(id: string) {
  try {
    await store.deleteGoal(id)
    toast.success('Meta excluída')
  } catch {
    toast.error('Erro ao excluir meta')
  }
}

// Placeholder handlers — will be wired in Sprint 3 and 4
function openCreate() {
  // Sprint 3: GoalFormDialog
}
 
function openEdit(goal: Goal) { void goal /* Sprint 3: GoalFormDialog */ }
 
function openUpdateProgress(goal: Goal) { void goal /* Sprint 4: GoalProgressDialog */ }

onMounted(() => store.fetchGoals())
</script>

<template>
  <div class="flex flex-col min-h-full">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start justify-between px-4 sm:px-6 pt-6 pb-4 gap-3 sm:gap-0 shrink-0">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5">
          Produtividade
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Metas
        </h1>
        <p class="text-[13px] text-muted-foreground/50">
          {{ activeGoals.length }} meta{{ activeGoals.length !== 1 ? 's' : '' }} ativa{{ activeGoals.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <Button size="sm" class="h-8 text-[12px] sm:mt-1 shrink-0" @click="openCreate">
        <Plus :size="12" class="mr-1.5" />
        Nova meta
      </Button>
    </div>

    <!-- Stats summary -->
    <div class="px-4 sm:px-6 pb-5 shrink-0">
      <GoalsSummary
        :active-count="activeGoals.length"
        :completed-count="completedGoals.length"
        :average-progress="averageProgress"
        :overdue-count="overdueGoals.length"
        :loading="store.loading"
      />
    </div>

    <!-- Goals list -->
    <div class="flex-1 px-4 sm:px-6 pb-8">

      <!-- Loading skeleton -->
      <template v-if="store.loading">
        <div class="space-y-6">
          <div v-for="i in 2" :key="i">
            <div class="flex justify-between px-1 mb-2">
              <Skeleton class="h-3 w-20" />
              <Skeleton class="h-3 w-4" />
            </div>
            <div class="rounded-lg border border-border/50 overflow-hidden">
              <div v-for="j in 3" :key="j" class="flex items-center gap-4 px-4 py-3 border-b border-border/25 last:border-b-0">
                <div class="flex-1 space-y-1.5">
                  <Skeleton class="h-3.5 w-2/3" />
                  <Skeleton class="h-3 w-1/3" />
                </div>
                <div class="hidden sm:flex flex-col gap-1.5 w-[180px]">
                  <Skeleton class="h-1 w-full rounded-full" />
                  <Skeleton class="h-3 w-1/2" />
                </div>
                <Skeleton class="h-5 w-10 rounded" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <template v-else-if="store.goals.length === 0">
        <div class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-10 h-10 rounded-xl bg-foreground/[0.04] border border-border/50 flex items-center justify-center mb-4">
            <span class="text-lg">🎯</span>
          </div>
          <p class="text-[13px] font-medium text-foreground/60 mb-1">Nenhuma meta ainda</p>
          <p class="text-[12px] text-muted-foreground/40 mb-4">
            Defina objetivos financeiros, pessoais e de saúde.
          </p>
          <Button size="sm" class="h-8 text-[12px]" @click="openCreate">
            <Plus :size="12" class="mr-1.5" />
            Criar primeira meta
          </Button>
        </div>
      </template>

      <!-- Groups -->
      <template v-else>
        <div class="space-y-8">
          <GoalGroup
            v-for="group in groups"
            :key="group.type"
            :label="group.label"
            :goals="group.goals"
            @edit="openEdit"
            @delete="handleDelete"
            @update-progress="openUpdateProgress"
          />
        </div>
      </template>

    </div>

  </div>
</template>
