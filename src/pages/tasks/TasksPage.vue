<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, Plus } from 'lucide-vue-next'
import { AppPageContainer, PageHeader } from '@/components/shared'
import TasksSubNav from '@/features/tasks/components/TasksSubNav.vue'
import TaskDaySummaryCard from '@/features/tasks/components/TaskDaySummaryCard.vue'
import TaskListView from '@/features/tasks/views/TaskListView.vue'
import TaskPeriodView from '@/features/tasks/views/TaskPeriodView.vue'
import TaskCreateSheet from '@/features/tasks/components/TaskCreateSheet.vue'
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet.vue'
import { useTaskStore } from '@/stores/tasks'
import { isTaskOverdue } from '@/features/tasks/utils/taskHelpers'
import type { Task } from '@/types/tasks'
import type { TaskViewId } from '@/features/tasks/types'

const store = useTaskStore()
const route = useRoute()
const router = useRouter()

// ── Selected view — URL é a fonte de verdade; localStorage só como fallback ──
const VIEW_KEY = 'tasks:selectedView'
const selectedView = ref<TaskViewId>(
  (localStorage.getItem(VIEW_KEY) as TaskViewId) ?? 'all',
)
watch(selectedView, (v) => localStorage.setItem(VIEW_KEY, v))
watch(
  () => route.query.view,
  (view) => {
    if (view && typeof view === 'string') selectedView.value = view as TaskViewId
  },
  { immediate: true },
)

function selectView(view: TaskViewId) {
  selectedView.value = view
  router.replace({ query: { ...route.query, view } })
}

// ── Derived tasks by selected view ───────────────────────────────────────────
function todayStr() {
  return new Date().toLocaleDateString('en-CA')
}
function addDaysStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

const displayTasks = computed(() => {
  const today = todayStr()
  const nextWeek = addDaysStr(7)
  const tasks = store.tasks

  switch (selectedView.value) {
    case 'today':
      return tasks.filter(
        (t) => t.due_date === today && t.status !== 'cancelled',
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
          (t) => t.labels.some((l) => l.id === labelId) && t.status !== 'cancelled' && t.status !== 'completed',
        )
      }
      return tasks.filter((t) => t.status !== 'cancelled' && t.status !== 'completed')
    }
  }
})

const pendingCount = computed(() =>
  store.tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length,
)

const overdueCount = computed(() => store.overdueTasks.length)

// ── Daily progress ───────────────────────────────────────────────────────────
const progress = computed(() => store.todayProgress)

const subtitle = computed(() => {
  const p = `${pendingCount.value} pendente${pendingCount.value !== 1 ? 's' : ''}`
  return overdueCount.value > 0
    ? `${p} · ${overdueCount.value} atrasada${overdueCount.value !== 1 ? 's' : ''}`
    : p
})

// ── Sheets ───────────────────────────────────────────────────────────────────
const createOpen = ref(false)
const detailOpen = ref(false)
const selectedTask = ref<Task | null>(null)

function openDetail(task: Task) {
  selectedTask.value = task
  detailOpen.value = true
}

async function handleToggle(id: string) {
  await store.toggleComplete(id)
}

// Keep selected task reactive as store updates
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

// ── Keyboard shortcut: 'n' to create ────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const active = document.activeElement as HTMLElement
    if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return
    createOpen.value = true
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
    <PageHeader title="Tarefas" :subtitle="subtitle">
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
          @click="createOpen = true"
        >
          <Plus class="size-3.5" />
          Nova tarefa
        </button>
      </template>
    </PageHeader>

    <!-- Desktop: sempre 2 colunas — em telas maiores as colunas alargam -->
    <div class="lg:grid lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">

      <!-- Resumo do dia -->
      <div class="mb-4 lg:mb-0">
        <TaskDaySummaryCard
          :today-total="progress.total"
          :today-completed="progress.completed"
          :overdue-count="overdueCount"
        />
      </div>

      <div class="min-w-0">
        <!-- Pill tabs (filtros do módulo) -->
        <TasksSubNav :selected-view="selectedView" @update:selected-view="selectView" />

        <!-- Error banner -->
        <div
          v-if="store.error"
          class="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 mb-4 bg-muted text-destructive text-[12px]"
        >
          <div class="flex items-center gap-2">
            <AlertTriangle :size="14" class="shrink-0" />
            <span>{{ store.error }}</span>
          </div>
          <button
            class="underline shrink-0 hover:text-foreground transition-colors"
            @click="store.fetchTasks()"
          >Tentar novamente</button>
        </div>

        <!-- Task list — period grouped for "today" view, regular otherwise -->
        <TaskPeriodView
          v-if="selectedView === 'today'"
          :tasks="displayTasks"
          :loading="store.loading"
          @toggle="handleToggle"
          @open="openDetail"
          @create="createOpen = true"
        />
        <TaskListView
          v-else
          :tasks="displayTasks"
          :loading="store.loading"
          @toggle="handleToggle"
          @open="openDetail"
          @create="createOpen = true"
        />
      </div>
    </div>

  </AppPageContainer>

  <!-- Create sheet -->
  <TaskCreateSheet v-model:open="createOpen" />

  <!-- Detail sheet -->
  <TaskDetailSheet
    v-model:open="detailOpen"
    :task="selectedTask"
    @deleted="detailOpen = false"
  />
</template>
