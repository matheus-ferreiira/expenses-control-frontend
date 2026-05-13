<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { AppPageContainer, PageHeader } from '@/components/shared'
import HabitToolbar from '@/features/habits/components/HabitToolbar.vue'
import HabitGridView from '@/features/habits/views/HabitGridView.vue'
import HabitListView from '@/features/habits/views/HabitListView.vue'
import HabitFormDialog from '@/features/habits/components/HabitFormDialog.vue'
import HabitDetailsSheet from '@/features/habits/components/HabitDetailsSheet.vue'
import { useHabitStore } from '@/stores/habits'
import { useHabitFilters } from '@/features/habits/composables/useHabitFilters'
import { useDebounce } from '@/composables/useDebounce'
import type { Habit } from '@/types/habits'
import type { ViewMode } from '@/features/habits/types'
import { useToast } from '@/composables/useToast'

const store = useHabitStore()
const filterState = useHabitFilters()
const toast = useToast()

// View mode — persisted
const VIEW_MODE_KEY = 'habits:viewMode'
const viewMode = ref<ViewMode>(
  (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) ?? 'grid',
)
watch(viewMode, (v) => localStorage.setItem(VIEW_MODE_KEY, v))

// Dialogs
const formOpen = ref(false)
const editingHabit = ref<Habit | null>(null)
const detailOpen = ref(false)
const selectedHabit = ref<Habit | null>(null)

// Debounced search
const debouncedSearch = useDebounce(filterState.search, 300)

// Filtered habits
const filteredHabits = computed(() => {
  let list = store.habits

  // Active filter
  if (!filterState.showArchived.value) {
    list = list.filter((h) => h.is_active)
  }

  // Frequency filter
  if (filterState.frequency.value) {
    list = list.filter((h) => h.frequency === filterState.frequency.value)
  }

  // Search
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

// Keep selectedHabit in sync with store
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

// Keyboard shortcut: N → create new habit
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
  <AppPageContainer>
    <!-- Header -->
    <PageHeader
      category="PRODUTIVIDADE"
      title="Hábitos"
      subtitle="Construa consistência diária com acompanhamento visual e streaks."
    >
      <template #actions>
        <span class="text-xs text-muted-foreground hidden sm:inline">
          {{ store.habits.filter(h => h.is_active).length }} ativo{{ store.habits.filter(h => h.is_active).length !== 1 ? 's' : '' }}
        </span>
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <div class="mb-4">
      <HabitToolbar
        :filter-state="filterState"
        :search="filterState.search.value"
        v-model:view-mode="viewMode"
        :loading="store.loading"
        @create="openCreate()"
        @update:search="filterState.search.value = $event"
      />
    </div>

    <!-- Grid view -->
    <HabitGridView
      v-if="viewMode === 'grid'"
      :habits="filteredHabits"
      :loading="store.loading"
      @log="handleLog"
      @edit="openEdit"
      @delete="handleDelete"
      @archive="handleArchive"
      @open="openDetail"
      @create="openCreate()"
    />

    <!-- List view -->
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
  </AppPageContainer>

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
