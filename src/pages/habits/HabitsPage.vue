<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, Flame, CheckCircle2 } from 'lucide-vue-next'
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
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 lg:px-8 pt-6 pb-5 border-b border-border mb-6 shrink-0">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Rotina
        </p>
        <h1 class="text-xl md:text-2xl font-semibold tracking-tight text-foreground mt-0.5">
          Hábitos
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          Construa consistência diária com acompanhamento visual e streaks.
        </p>
      </div>
      <button
        class="hidden md:inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md bg-foreground text-background hover:opacity-90 transition-opacity shrink-0"
        @click="openCreate"
      >
        <Plus :size="14" />
        Novo hábito
      </button>
    </div>

    <!-- Mobile compact stats bar -->
    <div class="lg:hidden px-5 pb-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5 text-sm">
          <Flame :size="16" class="streak-glow" style="color: hsl(var(--warning))" />
          <span class="font-semibold tabular-nums" style="color: hsl(var(--warning))">{{ longestStreak }}</span>
          <span class="text-[11px] text-muted-foreground">streak</span>
        </div>
        <div class="h-4 w-px bg-border" />
        <div class="flex items-center gap-1.5 text-sm">
          <CheckCircle2
            :size="16"
            :style="completedTodayCount === activeHabits.length && activeHabits.length > 0 ? 'color: hsl(var(--success))' : 'color: hsl(var(--muted-foreground))'"
          />
          <span
            class="font-semibold tabular-nums"
            :style="completedTodayCount === activeHabits.length && activeHabits.length > 0 ? 'color: hsl(var(--success))' : ''"
          >{{ completedTodayCount }}/{{ activeHabits.length }}</span>
          <span class="text-[11px] text-muted-foreground">hoje</span>
        </div>
        <div class="h-4 w-px bg-border" />
        <div class="text-sm">
          <span
            class="font-semibold tabular-nums"
            :style="weeklyConsistency >= 80 ? 'color: hsl(var(--success))' : ''"
          >{{ weeklyConsistency }}%</span>
          <span class="text-[11px] text-muted-foreground ml-1">semana</span>
        </div>
      </div>
    </div>

    <!-- Stats row (desktop only) -->
    <div class="hidden lg:block px-5 lg:px-8 pb-5 shrink-0">
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
    <div class="flex-1 flex gap-5 px-5 lg:px-8 pb-6 min-w-0">

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
    <div v-if="activeHabits.length > 0" class="hidden lg:block px-5 lg:px-8 mt-0 pb-8 shrink-0">
      <section class="bg-card border border-border rounded-md overflow-hidden">
        <header class="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 class="text-sm font-semibold text-foreground">Heatmap de consistência — últimas 12 semanas</h2>
        </header>
        <HabitsHeatmap :habits="store.habits" />
      </section>
    </div>

  </div>

  <!-- Mobile FAB -->
  <button
    class="lg:hidden fixed right-4 bottom-24 h-14 px-5 rounded-full bg-primary text-primary-foreground flex items-center gap-2 shadow-lg z-40"
    @click="openCreate"
  >
    <Plus :size="18" />
    <span class="text-sm font-medium">Hábito</span>
  </button>

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
