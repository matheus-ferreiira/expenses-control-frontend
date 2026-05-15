<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, PanelLeft } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { Sheet, SheetContent } from '@ui/sheet'
import TasksLeftPanel from '@/features/tasks/components/TasksLeftPanel.vue'
import TaskToolbar from '@/features/tasks/components/TaskToolbar.vue'
import TaskListView from '@/features/tasks/views/TaskListView.vue'
import TaskKanbanView from '@/features/tasks/views/TaskKanbanView.vue'
import TaskCalendarView from '@/features/tasks/views/TaskCalendarView.vue'
import TaskFormDialog from '@/features/tasks/components/TaskFormDialog.vue'
import TaskDetailsSheet from '@/features/tasks/components/TaskDetailsSheet.vue'
import { useTaskStore } from '@/stores/tasks'
import { useTaskFilters } from '@/features/tasks/composables/useTaskFilters'
import { useDebounce } from '@/composables/useDebounce'
import { sortTasks, isTaskOverdue } from '@/features/tasks/utils/taskHelpers'
import type { Task } from '@/types/tasks'
import type { ViewMode, TaskViewId } from '@/features/tasks/types'
import type { SortField, SortDirection } from '@/features/tasks/utils/taskHelpers'

const store = useTaskStore()
const mobileLeftOpen = ref(false)
const filterState = useTaskFilters()

// View mode (list/kanban/calendar) — persisted
const VIEW_MODE_KEY = 'tasks:viewMode'
const viewMode = ref<ViewMode>(
  (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) ?? 'list',
)
watch(viewMode, (v) => localStorage.setItem(VIEW_MODE_KEY, v))

// Selected left-panel view — persisted
const VIEW_KEY = 'tasks:selectedView'
const selectedView = ref<TaskViewId>(
  (localStorage.getItem(VIEW_KEY) as TaskViewId) ?? 'all',
)
watch(selectedView, (v) => localStorage.setItem(VIEW_KEY, v))

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

// Local date helpers (avoid UTC offset issues)
function todayStr() {
  return new Date().toLocaleDateString('en-CA')
}

function addDaysStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

// Filter tasks by selected view
const filteredByView = computed(() => {
  const today = todayStr()
  const nextWeek = addDaysStr(7)
  const tasks = store.tasks

  switch (selectedView.value) {
    case 'today':
      return tasks.filter(
        (t) => t.due_date === today && t.status !== 'completed' && t.status !== 'cancelled',
      )
    case 'upcoming':
      return tasks.filter(
        (t) =>
          t.due_date &&
          t.due_date > today &&
          t.due_date <= nextWeek &&
          t.status !== 'completed' &&
          t.status !== 'cancelled',
      )
    case 'overdue':
      return tasks.filter((t) => isTaskOverdue(t))
    case 'completed':
      return tasks.filter((t) => t.status === 'completed')
    case 'no-date':
      return tasks.filter(
        (t) => !t.due_date && t.status !== 'completed' && t.status !== 'cancelled',
      )
    default: {
      if (selectedView.value.startsWith('label:')) {
        const labelId = selectedView.value.slice(6)
        return tasks.filter(
          (t) => t.labels.some((l) => l.id === labelId) && t.status !== 'cancelled',
        )
      }
      return tasks.filter((t) => t.status !== 'cancelled')
    }
  }
})

// Apply toolbar filters + sort on top of view filter
const displayTasks = computed(() => {
  let list = filteredByView.value

  const { filters } = filterState
  if (filters.value.status) list = list.filter((t) => t.status === filters.value.status)
  if (filters.value.priority) list = list.filter((t) => t.priority === filters.value.priority)
  if (filters.value.label_id)
    list = list.filter((t) => t.labels.some((l) => l.id === filters.value.label_id))
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

const viewTitle = computed(() => {
  switch (selectedView.value) {
    case 'today':
      return 'Hoje'
    case 'upcoming':
      return 'Próximas'
    case 'overdue':
      return 'Atrasadas'
    case 'completed':
      return 'Concluídas'
    case 'no-date':
      return 'Sem data'
    default:
      if (selectedView.value.startsWith('label:')) {
        const labelId = selectedView.value.slice(6)
        return store.labels.find((l) => l.id === labelId)?.name ?? 'Projeto'
      }
      return 'Todas as tarefas'
  }
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
  await store.toggleComplete(id)
}

async function handleDelete(id: string) {
  await store.deleteTask(id)
  if (selectedTask.value?.id === id) {
    detailOpen.value = false
    selectedTask.value = null
  }
}

async function handleArchive(id: string) {
  await store.archiveTask(id)
}

async function handleReorder(ids: string[]) {
  await store.reorderTasks(ids)
}

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
  <!-- Workspace layout: left panel + main content -->
  <div class="flex">

    <!-- Left panel: sticky alongside scrolling content (desktop only) -->
    <div class="hidden md:block sticky top-0 h-screen shrink-0">
      <TasksLeftPanel
        v-model:selected-view="selectedView"
        :labels="store.labels"
      />
    </div>

    <!-- Mobile left panel Sheet -->
    <Sheet v-model:open="mobileLeftOpen">
      <SheetContent side="left" class="p-0 w-[200px]">
        <TasksLeftPanel
          v-model:selected-view="selectedView"
          :labels="store.labels"
          @update:selected-view="mobileLeftOpen = false"
        />
      </SheetContent>
    </Sheet>

    <!-- Right content area -->
    <div class="flex flex-col flex-1 min-w-0">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between px-4 sm:px-6 pt-6 pb-4 gap-3 sm:gap-0 shrink-0">
        <div class="flex items-start gap-3">
          <!-- Mobile panel trigger -->
          <button
            class="md:hidden mt-1 shrink-0 transition-base"
            style="color: hsl(var(--muted-foreground) / 0.5)"
            @click="mobileLeftOpen = true"
          >
            <PanelLeft :size="18" />
          </button>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5">
              Produtividade
            </p>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none mb-1.5">
              {{ viewTitle }}
            </h1>
            <p class="text-[13px] text-muted-foreground/50">
              {{ displayTasks.length }} tarefa{{ displayTasks.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
        <Button size="sm" class="h-8 text-[12px] sm:mt-1 shrink-0" @click="openCreate">
          <Plus :size="12" class="mr-1.5" />
          Nova tarefa
        </Button>
      </div>

      <!-- Network error banner -->
      <div
        v-if="store.error"
        class="mx-6 mb-3 flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[12px] shrink-0"
        style="background: hsl(var(--destructive) / 0.1); color: hsl(var(--destructive))"
      >
        <span>{{ store.error }}</span>
        <button class="underline opacity-70 hover:opacity-100" @click="store.fetchTasks()">Tentar novamente</button>
      </div>

      <!-- Toolbar -->
      <div class="px-6 pb-4 shrink-0">
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
      <div class="flex-1 px-6 pb-6">
        <TaskListView
          v-if="viewMode === 'list'"
          :tasks="displayTasks"
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
          v-else-if="viewMode === 'kanban'"
          :tasks="displayTasks"
          :loading="store.loading"
          @toggle="handleToggle"
          @edit="openEdit"
          @delete="handleDelete"
          @archive="handleArchive"
          @open="openDetail"
          @create="openCreate"
        />

        <TaskCalendarView
          v-else-if="viewMode === 'calendar'"
          :tasks="store.tasks"
          @toggle="handleToggle"
          @edit="openEdit"
          @delete="handleDelete"
          @archive="handleArchive"
          @open="openDetail"
        />
      </div>

    </div>
  </div>

  <!-- Dialogs -->
  <TaskFormDialog
    v-model:open="formOpen"
    :task="editingTask"
    :labels="store.labels"
    @created="store.fetchTasks()"
    @updated="store.fetchTasks()"
  />

  <TaskDetailsSheet
    v-model:open="detailOpen"
    :task="selectedTask"
    @edit="openEdit"
    @deleted="handleDelete"
  />
</template>
