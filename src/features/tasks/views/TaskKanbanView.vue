<script setup lang="ts">
import { computed } from 'vue'
import TaskKanbanColumn from '../components/TaskKanbanColumn.vue'
import type { Task, TaskStatus } from '@/types/tasks'
import { groupByStatus } from '../utils/taskHelpers'
import { KANBAN_COLUMNS } from '../types'
import { useTaskDnd } from '../composables/useTaskDnd'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  delete: [id: string]
  archive: [id: string]
  open: [task: Task]
  create: [status: TaskStatus]
}>()

const { onListReorder, onKanbanDrop } = useTaskDnd()

const grouped = computed(() => groupByStatus(props.tasks))

function handleColumnReorder(ids: string[]) {
  onListReorder(ids)
}

function handleDrop(taskId: string, newStatus: TaskStatus) {
  onKanbanDrop(taskId, newStatus)
}
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="flex gap-4 overflow-x-auto pb-4">
    <div
      v-for="col in KANBAN_COLUMNS"
      :key="col.status"
      class="min-w-[280px] w-[280px] space-y-2"
    >
      <div class="h-6 w-24 rounded bg-muted animate-pulse" />
      <div class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  </div>

  <!-- Kanban board -->
  <div v-else class="overflow-x-auto pb-4">
    <div class="flex gap-4 min-w-max">
      <TaskKanbanColumn
        v-for="col in KANBAN_COLUMNS"
        :key="col.status"
        :column="col"
        :tasks="grouped[col.status]"
        @toggle="emit('toggle', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @archive="emit('archive', $event)"
        @open="emit('open', $event)"
        @create="emit('create', $event)"
        @reorder="handleColumnReorder"
        @drop="handleDrop"
      />
    </div>
  </div>
</template>
