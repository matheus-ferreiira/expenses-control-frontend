<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Plus } from 'lucide-vue-next'
import TaskKanbanCard from './TaskKanbanCard.vue'
import type { Task, TaskStatus } from '@/types/tasks'
import type { KanbanColumn } from '../types'

const props = defineProps<{
  column: KanbanColumn
  tasks: Task[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  delete: [id: string]
  archive: [id: string]
  open: [task: Task]
  create: [status: TaskStatus]
  reorder: [ids: string[]]
  drop: [taskId: string, newStatus: TaskStatus]
}>()

const localTasks = ref<Task[]>([...props.tasks])
watch(() => props.tasks, (v) => { localTasks.value = [...v] })

function onUpdate() {
  emit('reorder', localTasks.value.map((t) => t.id))
}

function onAdd(evt: { item: HTMLElement }) {
  const taskId = evt.item.dataset['taskId']
  if (taskId) emit('drop', taskId, props.column.status)
}
</script>

<template>
  <div class="flex flex-col min-w-[260px] w-[260px] shrink-0">
    <!-- Column header -->
    <div class="flex items-center justify-between mb-2.5 px-0.5">
      <div class="flex items-center gap-2">
        <span
          class="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style="color: hsl(var(--muted-foreground) / 0.5)"
        >
          {{ column.label }}
        </span>
        <span
          class="text-[10px] tabular-nums"
          style="color: hsl(var(--muted-foreground) / 0.3)"
        >
          {{ localTasks.length }}
        </span>
      </div>
      <button
        class="flex items-center justify-center h-5 w-5 rounded transition-base"
        style="color: hsl(var(--muted-foreground) / 0.35)"
        @mouseenter="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground) / 0.35)'"
        @click="emit('create', column.status)"
      >
        <Plus :size="13" />
      </button>
    </div>

    <!-- Drop zone -->
    <VueDraggable
      v-model="localTasks"
      :group="{ name: 'tasks', pull: true, put: true }"
      :animation="150"
      ghost-class="opacity-40"
      drag-class="opacity-80 scale-[1.01] ring-1 ring-primary/30"
      handle=".drag-handle"
      :data-status="column.status"
      class="flex flex-col gap-1.5 min-h-[100px] max-h-[calc(100vh-200px)] overflow-y-auto rounded-lg p-2 border border-border/40 transition-base"
      @update="onUpdate"
      @add="onAdd"
    >
      <div
        v-for="task in localTasks"
        :key="task.id"
        :data-task-id="task.id"
      >
        <TaskKanbanCard
          :task="task"
          @toggle="emit('toggle', $event)"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
          @archive="emit('archive', $event)"
          @open="emit('open', $event)"
        />
      </div>
    </VueDraggable>
  </div>
</template>
