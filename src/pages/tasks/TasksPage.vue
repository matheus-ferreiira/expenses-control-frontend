<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { AlertTriangle } from 'lucide-vue-next'
import TasksSubNav from '@/features/tasks/components/TasksSubNav.vue'
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

// ── Selected view — persisted + synced with URL query param ─────────────────
const VIEW_KEY = 'tasks:selectedView'
const selectedView = ref<TaskViewId>(
  (route.query.view as TaskViewId) ?? (localStorage.getItem(VIEW_KEY) as TaskViewId) ?? 'all',
)
watch(selectedView, (v) => localStorage.setItem(VIEW_KEY, v))
watch(() => route.query.view, (view) => {
  if (view && typeof view === 'string') selectedView.value = view as TaskViewId
})

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

// ── Daily progress ───────────────────────────────────────────────────────────
const progress = computed(() => store.todayProgress)
const showProgressBar = computed(() => progress.value.total > 0)

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
  <div class="w-full px-4 py-6">

    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
          PRODUTIVIDADE
        </p>
        <h1 class="text-[22px] font-bold text-foreground leading-none mb-1.5">Tarefas</h1>
        <p class="text-[13px] text-muted-foreground/60 tabular-nums">
          {{ pendingCount }} pendente{{ pendingCount !== 1 ? 's' : '' }}
        </p>
      </div>
      <button
        type="button"
        class="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium transition-all active:scale-95 shrink-0 mt-1"
        @click="createOpen = true"
      >
        + Nova tarefa
      </button>
    </div>

    <!-- Daily progress bar (shown when tasks exist for today) -->
    <div v-if="showProgressBar" class="mb-4">
      <div class="flex items-center justify-between mb-1.5">
        <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50">HOJE</p>
        <p class="text-[11px] tabular-nums text-muted-foreground/60">
          {{ progress.completed }}/{{ progress.total }}
          <span v-if="progress.percent >= 100" class="text-success font-semibold ml-1">✓ Tudo feito!</span>
        </p>
      </div>
      <div class="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="progress.percent >= 100 ? 'bg-success' : 'bg-primary'"
          :style="{ width: `${progress.percent}%` }"
        />
      </div>
    </div>

    <!-- Pill tabs -->
    <TasksSubNav v-model:selected-view="selectedView" />

    <!-- Error banner -->
    <div
      v-if="store.error"
      class="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 mb-4 bg-destructive/10 text-destructive text-[12px]"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle :size="14" class="shrink-0" />
        <span>{{ store.error }}</span>
      </div>
      <button
        class="underline opacity-70 hover:opacity-100 transition-opacity shrink-0"
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

  <!-- Create sheet -->
  <TaskCreateSheet v-model:open="createOpen" />

  <!-- Detail sheet -->
  <TaskDetailSheet
    v-model:open="detailOpen"
    :task="selectedTask"
    @deleted="detailOpen = false"
  />
</template>
