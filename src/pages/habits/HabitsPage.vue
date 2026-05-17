<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { Button } from '@ui/button'
import HabitStatsRow from '@/features/habits/components/HabitStatsRow.vue'
import HabitsRightPanel from '@/features/habits/components/HabitsRightPanel.vue'
import HabitsHeatmap from '@/features/habits/components/HabitsHeatmap.vue'
import HabitTableView from '@/features/habits/views/HabitTableView.vue'
import HabitListView from '@/features/habits/views/HabitListView.vue'
import HabitGridView from '@/features/habits/views/HabitGridView.vue'
import HabitFormDialog from '@/features/habits/components/HabitFormDialog.vue'
import HabitDetailsSheet from '@/features/habits/components/HabitDetailsSheet.vue'
import { useHabitStore } from '@/stores/habits'
import { useHabitFilters } from '@/features/habits/composables/useHabitFilters'
import { useDebounce } from '@/composables/useDebounce'
import { isCompletedToday } from '@/features/habits/utils/habitHelpers'
import type { Habit } from '@/types/habits'
import type { ViewMode } from '@/features/habits/types'
import { useToast } from '@/composables/useToast'

const store = useHabitStore()
const filterState = useHabitFilters()
const toast = useToast()

// View mode — persisted (table is new default)
const VIEW_MODE_KEY = 'habits:viewMode'
const viewMode = ref<ViewMode>(
  (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) ?? 'table',
)
watch(viewMode, (v) => localStorage.setItem(VIEW_MODE_KEY, v))

// Dialogs
const formOpen = ref(false)
const editingHabit = ref<Habit | null>(null)
const detailOpen = ref(false)
const selectedHabit = ref<Habit | null>(null)

// Debounced search
const debouncedSearch = useDebounce(filterState.search, 300)

// Active habits (not archived, not cancelled)
const activeHabits = computed(() => store.habits.filter((h) => h.is_active))

// Stats computed from store
const longestStreak = computed(() =>
  activeHabits.value.reduce((max, h) => Math.max(max, h.longest_streak), 0),
)

const completedTodayCount = computed(() =>
  activeHabits.value.filter((h) => isCompletedToday(h)).length,
)

const weeklyConsistency = computed(() => {
  if (!activeHabits.value.length) return 0
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const weekStartStr = sevenDaysAgo.toLocaleDateString('en-CA')
  const withRecentLogs = activeHabits.value.filter((h) =>
    h.logs.some((l) => l.completed_date >= weekStartStr),
  )
  return Math.round((withRecentLogs.length / activeHabits.value.length) * 100)
})

// Filtered habits
const filteredHabits = computed(() => {
  let list = store.habits

  if (!filterState.showArchived.value) {
    list = list.filter((h) => h.is_active)
  }

  if (filterState.frequency.value) {
    list = list.filter((h) => h.frequency === filterState.frequency.value)
  }

  if (debouncedSearch.value.trim()) {
    const q = debouncedSearch.value.trim().toLowerCase()
    list = list.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.description ?? '').toLowerCase().includes(q),
    )
  }

  return list
})

function openCreate() {
  editingHabit.value = null
  formOpen.value = true
}

function openEdit(habit: Habit) {
  editingHabit.value = habit
  formOpen.value = true
  detailOpen.value = false
}

function openDetail(habit: Habit) {
  selectedHabit.value = habit
  detailOpen.value = true
}

async function handleLog(id: string) {
  try {
    await store.optimisticLog(id)
  } catch {
    toast.error('Erro ao registrar hábito')
  }
}

async function handleDelete(id: string) {
  try {
    await store.deleteHabit(id)
    if (selectedHabit.value?.id === id) {
      detailOpen.value = false
      selectedHabit.value = null
    }
  } catch {
    toast.error('Erro ao excluir hábito')
  }
}

async function handleArchive(id: string) {
  try {
    await store.archiveHabit(id)
    toast.success('Hábito arquivado')
  } catch {
    toast.error('Erro ao arquivar hábito')
  }
}

watch(
  () => store.habits,
  (habits) => {
    if (selectedHabit.value) {
      const updated = habits.find((h) => h.id === selectedHabit.value!.id)
      if (updated) selectedHabit.value = updated
    }
  },
  { deep: true },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const active = document.activeElement as HTMLElement
    if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return
    openCreate()
  }
}

onMounted(async () => {
  await store.fetchHabits()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="flex flex-col min-h-full">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start justify-between px-4 sm:px-6 pt-6 pb-4 gap-3 sm:gap-0 shrink-0">
      <div>
        <p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Rotina
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-8 mb-1">
          Hábitos
        </h1>
        <p class="text-sm text-muted-foreground">
          Construa consistência diária com acompanhamento visual e streaks.
        </p>
      </div>
      <Button size="sm" class="hidden sm:inline-flex h-7 text-xs shrink-0 sm:mt-1" @click="openCreate">
        <Plus :size="12" class="mr-1.5" />
        Novo hábito
      </Button>
    </div>

    <!-- Mobile compact stats bar -->
    <div class="sm:hidden px-4 pb-4 shrink-0">
      <div class="flex items-center gap-3 text-[12px]" style="color: hsl(var(--muted-foreground) / 0.65)">
        <span v-if="longestStreak > 0">
          <span style="color: hsl(var(--warning) / 0.9)">🔥 {{ longestStreak }}</span>
          <span class="ml-1">streak</span>
        </span>
        <span v-if="longestStreak > 0" style="color: hsl(var(--border))">|</span>
        <span>
          <span :style="completedTodayCount === activeHabits.length && activeHabits.length > 0 ? 'color: hsl(var(--success))' : 'color: hsl(var(--foreground) / 0.8)'">
            {{ completedTodayCount }}/{{ activeHabits.length }}
          </span>
          <span class="ml-1">hoje</span>
        </span>
        <span style="color: hsl(var(--border))">|</span>
        <span>
          <span :style="weeklyConsistency >= 80 ? 'color: hsl(var(--success))' : 'color: hsl(var(--foreground) / 0.8)'">
            {{ weeklyConsistency }}%
          </span>
          <span class="ml-1">semana</span>
        </span>
      </div>
    </div>

    <!-- Stats row (desktop only) -->
    <div class="hidden sm:block px-4 sm:px-6 pb-5 shrink-0">
      <HabitStatsRow
        :active-count="activeHabits.length"
        :longest-streak="longestStreak"
        :weekly-consistency="weeklyConsistency"
        :completed-today="completedTodayCount"
        :total-active="activeHabits.length"
        :loading="store.loading"
      />
    </div>

    <!-- Main content: table + right panel -->
    <div class="flex-1 flex gap-6 px-4 sm:px-6 pb-6 min-w-0">

      <!-- Table view area -->
      <div class="flex-1 min-w-0">
        <HabitTableView
          v-if="viewMode === 'table' || !['grid', 'list'].includes(viewMode)"
          :habits="filteredHabits"
          :loading="store.loading"
          @log="handleLog"
          @edit="openEdit"
          @delete="handleDelete"
          @archive="handleArchive"
          @open="openDetail"
          @create="openCreate()"
        />

        <HabitGridView
          v-else-if="viewMode === 'grid'"
          :habits="filteredHabits"
          :loading="store.loading"
          @log="handleLog"
          @edit="openEdit"
          @delete="handleDelete"
          @archive="handleArchive"
          @open="openDetail"
          @create="openCreate()"
        />

        <HabitListView
          v-else
          :habits="filteredHabits"
          :loading="store.loading"
          @log="handleLog"
          @edit="openEdit"
          @delete="handleDelete"
          @archive="handleArchive"
          @open="openDetail"
          @create="openCreate()"
        />
      </div>

      <!-- Right panel (desktop only) -->
      <div class="hidden lg:block">
        <HabitsRightPanel :habits="store.habits" />
      </div>

    </div>

    <!-- Heatmap (desktop only, only when there are habits) -->
    <div v-if="activeHabits.length > 0" class="hidden lg:block px-4 sm:px-6 mt-0 pb-8 shrink-0">
      <section class="bg-card border border-border rounded-md overflow-hidden">
        <header class="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 class="text-sm font-semibold text-foreground">Heatmap de consistência — últimas 12 semanas</h2>
        </header>
        <HabitsHeatmap :habits="store.habits" />
      </section>
    </div>

  </div>

  <!-- Form dialog -->
  <HabitFormDialog
    v-model:open="formOpen"
    :habit="editingHabit"
    @created="store.fetchHabits()"
    @updated="store.fetchHabits()"
  />

  <!-- Details sheet -->
  <HabitDetailsSheet
    v-model:open="detailOpen"
    :habit="selectedHabit"
    @edit="openEdit"
    @deleted="handleDelete"
  />
</template>
