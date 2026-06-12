<script setup lang="ts">
import { computed } from 'vue'
import { Inbox, Plus } from 'lucide-vue-next'
import { EmptyState } from '@/components/shared'
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

interface PeriodGroup {
  id: string
  label: string
  tasks: Task[]
}

const PERIOD_DEFS = [
  { id: 'morning',   label: 'MANHÃ',       test: (h: number) => h < 12 },
  { id: 'afternoon', label: 'TARDE',       test: (h: number) => h >= 12 && h < 18 },
  { id: 'evening',   label: 'NOITE',       test: (h: number) => h >= 18 },
] as const

const groups = computed<PeriodGroup[]>(() => {
  const withTime = props.tasks.filter((t) => t.due_time)
  const noTime = props.tasks.filter((t) => !t.due_time)

  const periods: PeriodGroup[] = PERIOD_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    tasks: withTime.filter((t) => {
      const h = parseInt(t.due_time!.split(':')[0] ?? '0', 10)
      return def.test(h)
    }).sort((a, b) => (a.due_time ?? '').localeCompare(b.due_time ?? '')),
  })).filter((g) => g.tasks.length > 0)

  if (noTime.length) {
    periods.push({ id: 'no_time', label: 'SEM HORÁRIO', tasks: noTime })
  }

  return periods
})
</script>

<template>
  <!-- Empty state -->
  <EmptyState
    v-if="!loading && groups.length === 0"
    :icon="Inbox"
    title="Nenhuma tarefa para hoje"
    description="Crie uma nova tarefa para começar o dia."
    :cta-icon="Plus"
    cta-label="Nova tarefa"
    @cta="emit('create')"
  />

  <!-- Period groups -->
  <div v-else class="rounded-lg border border-border overflow-hidden">
    <template v-for="(group, gi) in groups" :key="group.id">
      <!-- Group separator -->
      <div v-if="gi > 0" class="h-px bg-border/20" />

      <!-- Period header -->
      <div class="flex items-center gap-2 px-4 py-2 border-b border-border/30">
        <span class="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
          {{ group.label }}
        </span>
        <span class="text-[10px] text-muted-foreground/35">{{ group.tasks.length }}</span>
      </div>

      <!-- Task rows -->
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
