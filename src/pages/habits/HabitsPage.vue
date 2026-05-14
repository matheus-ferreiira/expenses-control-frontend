<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { Button } from '@ui/button'
import HabitToolbar from '@/features/habits/components/HabitToolbar.vue'
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
  activeHabits.value.reduce((max, h) => Math.max(max, h.current_streak), 0),
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
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5">
          Produtividade
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Hábitos
        </h1>
        <p class="text-[13px] text-muted-foreground/50">
          {{ activeHabits.length }} hábito{{ activeHabits.length !== 1 ? 's' : '' }} ativo{{ activeHabits.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <Button size="sm" class="h-8 text-[12px] sm:mt-1 shrink-0" @click="openCreate">
        <Plus :size="12" class="mr-1.5" />
        Novo hábito
      </Button>
    </div>

    <!-- Stats row -->
    <div class="px-4 sm:px-6 pb-5 shrink-0">
      <HabitStatsRow
        :active-count="activeHabits.length"
        :longest-streak="longestStreak"
        :weekly-consistency="weeklyConsistency"
        :completed-today="completedTodayCount"
        :total-active="activeHabits.length"
        :loading="store.loading"
      />
    </div>

    <!-- Toolbar -->
    <div class="px-4 sm:px-6 pb-4 shrink-0">
      <HabitToolbar
        :filter-state="filterState"
        :search="filterState.search.value"
        v-model:view-mode="viewMode"
        :loading="store.loading"
        @create="openCreate()"
        @update:search="filterState.search.value = $event"
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

    <!-- Heatmap (only when there are habits) -->
    <div v-if="activeHabits.length > 0" class="px-4 sm:px-6 pt-2 pb-8 shrink-0">
      <div class="border-t border-border/30 pt-5">
        <HabitsHeatmap :habits="store.habits" />
      </div>
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
