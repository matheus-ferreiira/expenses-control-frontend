<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { AppPageContainer, PageHeader } from '@/components/shared'
import TaskToolbar from '@/features/tasks/components/TaskToolbar.vue'
import TaskListView from '@/features/tasks/views/TaskListView.vue'
import TaskKanbanView from '@/features/tasks/views/TaskKanbanView.vue'
import TaskFormDialog from '@/features/tasks/components/TaskFormDialog.vue'
import TaskDetailsSheet from '@/features/tasks/components/TaskDetailsSheet.vue'
import { useTaskStore } from '@/stores/tasks'
import { useTaskFilters } from '@/features/tasks/composables/useTaskFilters'
import { useDebounce } from '@/composables/useDebounce'
import { sortTasks } from '@/features/tasks/utils/taskHelpers'
import type { Task } from '@/types/tasks'
import type { ViewMode } from '@/features/tasks/types'
import type { SortField, SortDirection } from '@/features/tasks/utils/taskHelpers'

const store = useTaskStore()
const filterState = useTaskFilters()

// View mode — persisted
const VIEW_MODE_KEY = 'tasks:viewMode'
const viewMode = ref<ViewMode>(
  (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) ?? 'list',
)
watch(viewMode, (v) => localStorage.setItem(VIEW_MODE_KEY, v))

// Sort
const sortField = ref<SortField>('order')
const sortDirection = ref<SortDirection>('asc')

// Dialogs
const formOpen = ref(false)
const editingTask = ref<Task | null>(null)
const detailOpen = ref(false)
const selectedTask = ref<Task | null>(null)

// Debounced search
const debouncedSearch = useDebounce(filterState.search, 300)

// Filtered + sorted tasks
const filteredTasks = computed(() => {
  let list = store.tasks

  const { filters } = filterState
  if (filters.value.status) {
    list = list.filter((t) => t.status === filters.value.status)
  }
  if (filters.value.priority) {
    list = list.filter((t) => t.priority === filters.value.priority)
  }
  if (filters.value.label_id) {
    list = list.filter((t) => t.labels.some((l) => l.id === filters.value.label_id))
  }
  if (debouncedSearch.value.trim()) {
    const q = debouncedSearch.value.trim().toLowerCase()
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q),
    )
  }

  return sortTasks(list, sortField.value, sortDirection.value)
})

function openCreate() {
  editingTask.value = null
  formOpen.value = true
}

function openEdit(task: Task) {
  editingTask.value = task
  formOpen.value = true
  detailOpen.value = false
}

function openDetail(task: Task) {
  selectedTask.value = task
  detailOpen.value = true
}

function handleSort(field: SortField, direction: SortDirection) {
  sortField.value = field
  sortDirection.value = direction
}

async function handleToggle(id: string) {
  try {
    await store.toggleComplete(id)
  } catch {
    // toast already handled in store actions if we add it
  }
}

async function handleDelete(id: string) {
  try {
    await store.deleteTask(id)
    if (selectedTask.value?.id === id) {
      detailOpen.value = false
      selectedTask.value = null
    }
  } catch {
    // handled by store
  }
}

async function handleArchive(id: string) {
  try {
    await store.changeStatus(id, 'cancelled')
  } catch {
    // handled by store
  }
}

async function handleReorder(ids: string[]) {
  try {
    await store.reorderTasks(ids)
  } catch {
    // handled by store
  }
}

// Keep selectedTask in sync with store (for detail sheet reflecting updates)
watch(
  () => store.tasks,
  (tasks) => {
    if (selectedTask.value) {
      const updated = tasks.find((t) => t.id === selectedTask.value!.id)
      if (updated) selectedTask.value = updated
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
  await Promise.all([store.fetchTasks(), store.fetchLabels()])
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
      title="Tarefas"
      subtitle="Organize seu fluxo de trabalho com listas e kanban."
    >
      <template #actions>
        <span class="text-xs text-muted-foreground hidden sm:inline">
          {{ store.tasks.length }} tarefa{{ store.tasks.length !== 1 ? 's' : '' }}
        </span>
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <div class="mb-4">
      <TaskToolbar
        :filter-state="filterState"
        :search="filterState.search.value"
        :labels="store.labels"
        v-model:view-mode="viewMode"
        :loading="store.loading"
        @create="openCreate()"
        @update:search="filterState.search.value = $event"
        @sort="handleSort"
      />
    </div>

    <!-- Views -->
    <TaskListView
      v-if="viewMode === 'list'"
      :tasks="filteredTasks"
      :loading="store.loading"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      @toggle="handleToggle"
      @edit="openEdit"
      @delete="handleDelete"
      @archive="handleArchive"
      @open="openDetail"
      @reorder="handleReorder"
      @create="openCreate()"
    />

    <TaskKanbanView
      v-else
      :tasks="filteredTasks"
      :loading="store.loading"
      @toggle="handleToggle"
      @edit="openEdit"
      @delete="handleDelete"
      @archive="handleArchive"
      @open="openDetail"
      @create="openCreate"
    />
  </AppPageContainer>

  <!-- Form dialog -->
  <TaskFormDialog
    v-model:open="formOpen"
    :task="editingTask"
    :labels="store.labels"
    @created="store.fetchTasks()"
    @updated="store.fetchTasks()"
  />

  <!-- Details sheet -->
  <TaskDetailsSheet
    v-model:open="detailOpen"
    :task="selectedTask"
    @edit="openEdit"
    @deleted="handleDelete"
  />
</template>
