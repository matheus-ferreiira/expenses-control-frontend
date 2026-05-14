<script setup lang="ts">
import { computed } from 'vue'
import { Inbox, Plus } from 'lucide-vue-next'
import { Skeleton } from '@ui/skeleton'
import { EmptyState } from '@/components/shared'
import TaskGroupHeader from '../components/TaskGroupHeader.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskInlineCreate from '../components/TaskInlineCreate.vue'
import type { Task } from '@/types/tasks'
import type { SortField, SortDirection } from '../utils/taskHelpers'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
  sortField?: SortField
  sortDirection?: SortDirection
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  delete: [id: string]
  archive: [id: string]
  open: [task: Task]
  reorder: [ids: string[]]
  create: []
}>()

interface TaskGroup {
  id: string
  label: string
  tasks: Task[]
  groupDate: string | null
}

const groups = computed<TaskGroup[]>(() => {
  const todayStr = new Date().toLocaleDateString('en-CA')
  const dTomorrow = new Date()
  dTomorrow.setDate(dTomorrow.getDate() + 1)
  const tomorrowStr = dTomorrow.toLocaleDateString('en-CA')
  const dWeek = new Date()
  dWeek.setDate(dWeek.getDate() + 7)
  const weekStr = dWeek.toLocaleDateString('en-CA')

  const overdue: Task[] = []
  const today: Task[] = []
  const tomorrow: Task[] = []
  const week: Task[] = []
  const upcoming: Task[] = []
  const noDate: Task[] = []
  const completed: Task[] = []

  for (const task of props.tasks) {
    if (task.status === 'cancelled') continue

    if (task.status === 'completed') {
      completed.push(task)
      continue
    }

    if (!task.due_date) {
      noDate.push(task)
    } else if (task.due_date < todayStr) {
      overdue.push(task)
    } else if (task.due_date === todayStr) {
      today.push(task)
    } else if (task.due_date === tomorrowStr) {
      tomorrow.push(task)
    } else if (task.due_date <= weekStr) {
      week.push(task)
    } else {
      upcoming.push(task)
    }
  }

  return [
    { id: 'overdue',   label: 'Atrasadas',    tasks: overdue,   groupDate: null        },
    { id: 'today',     label: 'Hoje',          tasks: today,     groupDate: todayStr    },
    { id: 'tomorrow',  label: 'Amanhã',        tasks: tomorrow,  groupDate: tomorrowStr },
    { id: 'week',      label: 'Esta semana',   tasks: week,      groupDate: null        },
    { id: 'upcoming',  label: 'Próximas',      tasks: upcoming,  groupDate: null        },
    { id: 'no-date',   label: 'Sem data',      tasks: noDate,    groupDate: null        },
    { id: 'completed', label: 'Concluídas',    tasks: completed, groupDate: null        },
  ].filter((g) => g.tasks.length > 0)
})
</script>

<template>
  <!-- Loading skeletons -->
  <div v-if="loading" class="rounded-lg border border-border overflow-hidden divide-y divide-border/30">
    <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-2.5">
      <Skeleton class="h-3.5 w-3.5 rounded shrink-0" />
      <Skeleton class="h-3.5 rounded" :class="`w-[${45 + (i % 3) * 15}%]`" :style="{ width: `${45 + (i % 3) * 15}%` }" />
      <Skeleton class="ml-auto h-3.5 w-14" />
    </div>
  </div>

  <!-- Empty state -->
  <EmptyState
    v-else-if="groups.length === 0"
    :icon="Inbox"
    title="Nenhuma tarefa encontrada"
    description="Crie uma nova tarefa ou ajuste os filtros."
    :cta-icon="Plus"
    cta-label="Nova tarefa"
    @cta="emit('create')"
  />

  <!-- Grouped task list -->
  <div v-else class="rounded-lg border border-border overflow-hidden">
    <template v-for="(group, gi) in groups" :key="group.id">
      <!-- Group separator (between groups, not before first) -->
      <div v-if="gi > 0" class="h-px bg-border/20" />

      <!-- Group header -->
      <TaskGroupHeader :label="group.label" :count="group.tasks.length" />

      <!-- Task rows -->
      <TaskCard
        v-for="task in group.tasks"
        :key="task.id"
        :task="task"
        @toggle="emit('toggle', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @archive="emit('archive', $event)"
        @open="emit('open', $event)"
      />

      <!-- Inline create (all groups except completed) -->
      <TaskInlineCreate
        v-if="group.id !== 'completed'"
        :group-date="group.groupDate"
      />
    </template>
  </div>
</template>
