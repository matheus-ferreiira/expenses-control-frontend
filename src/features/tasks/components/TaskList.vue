<script setup lang="ts">
import { computed } from 'vue'
import { Inbox } from 'lucide-vue-next'
import { EmptyState } from '@/components/shared'
import TaskCard from './TaskCard.vue'
import type { Task } from '@/types/tasks'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  draggable?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  delete: [id: string]
  archive: [id: string]
  open: [task: Task]
  reorder: [ids: string[]]
}>()

// Expose tasks as a writable model for vue-draggable-plus (installed in Sprint 6)
const model = computed({
  get: () => props.tasks,
  set: (val) => emit('reorder', val.map((t) => t.id)),
})
</script>

<template>
  <div class="rounded-lg border border-border overflow-hidden">
    <!-- Loading skeletons -->
    <div v-if="loading" class="divide-y divide-border/50">
      <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-3">
        <div class="h-4 w-4 rounded bg-muted animate-pulse shrink-0" />
        <div class="h-4 rounded bg-muted animate-pulse flex-1" :style="{ width: `${55 + (i % 3) * 15}%` }" />
        <div class="h-4 w-16 rounded bg-muted animate-pulse" />
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="tasks.length === 0"
      :icon="Inbox"
      :title="emptyTitle ?? 'Nenhuma tarefa'"
      :description="emptyDescription"
    >
      <template v-if="$slots['empty-action']" #action>
        <slot name="empty-action" />
      </template>
    </EmptyState>

    <!-- Task rows -->
    <template v-else>
      <TaskCard
        v-for="task in model"
        :key="task.id"
        :task="task"
        :draggable="draggable"
        @toggle="emit('toggle', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @archive="emit('archive', $event)"
        @open="emit('open', $event)"
      />
    </template>
  </div>
</template>
