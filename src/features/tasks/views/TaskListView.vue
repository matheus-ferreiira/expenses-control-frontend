<script setup lang="ts">
import { computed } from 'vue'
import { Inbox, Plus } from 'lucide-vue-next'
import { Skeleton } from '@ui/skeleton'
import { EmptyState } from '@/components/shared'
import TaskGroupHeader from '../components/TaskGroupHeader.vue'
import TaskItem from '../components/TaskItem.vue'
import type { Task } from '@/types/tasks'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  open: [task: Task]
  create: []
}>()

interface TaskGroup {
  id: string
  label: string
  tasks: Task[]
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
    { id: 'overdue',   label: 'Atrasadas',   tasks: overdue   },
    { id: 'today',     label: 'Hoje',        tasks: today     },
    { id: 'tomorrow',  label: 'Amanhã',      tasks: tomorrow  },
    { id: 'week',      label: 'Esta semana', tasks: week      },
    { id: 'upcoming',  label: 'Próximas',    tasks: upcoming  },
    { id: 'no-date',   label: 'Sem data',    tasks: noDate    },
    { id: 'completed', label: 'Concluídas',  tasks: completed },
  ].filter((g) => g.tasks.length > 0)
})
</script>

<template>
  <!-- Loading skeletons -->
  <div v-if="loading" class="space-y-0.5">
    <div v-for="i in 6" :key="i" class="flex items-center gap-3 py-3">
      <Skeleton class="size-5 rounded-full shrink-0" />
      <Skeleton class="h-3.5 rounded" :style="{ width: `${45 + (i % 3) * 15}%` }" />
      <Skeleton class="ml-auto h-3.5 w-14" />
    </div>
  </div>

  <!-- Empty state -->
  <EmptyState
    v-else-if="groups.length === 0"
    :icon="Inbox"
    title="Nenhuma tarefa encontrada"
    description="Crie uma nova tarefa para começar."
    :cta-icon="Plus"
    cta-label="Nova tarefa"
    @cta="emit('create')"
  />

  <!-- Grouped task list — no outer border -->
  <div v-else>
    <template v-for="group in groups" :key="group.id">
      <TaskGroupHeader :label="group.label" :count="group.tasks.length" :group-id="group.id" />
      <TaskItem
        v-for="task in group.tasks"
        :key="task.id"
        :task="task"
        @toggle="emit('toggle', $event)"
        @open="emit('open', $event)"
      />
    </template>
  </div>
</template>
