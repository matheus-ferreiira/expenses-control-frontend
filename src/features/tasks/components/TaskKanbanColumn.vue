<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Button } from '@ui/button'
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
  <div class="flex flex-col min-w-[280px] w-[280px] shrink-0">
    <!-- Column header -->
    <div class="flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-2">
        <span :class="['w-2 h-2 rounded-full', column.colorClass.replace('text-', 'bg-')]" />
        <span :class="['text-sm font-semibold', column.colorClass]">
          {{ column.label }}
        </span>
        <span class="text-xs text-muted-foreground font-medium">
          {{ localTasks.length }}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6 text-muted-foreground hover:text-foreground"
        @click="emit('create', column.status)"
      >
        <Plus :size="14" />
      </Button>
    </div>

    <!-- Drop zone -->
    <VueDraggable
      v-model="localTasks"
      :group="{ name: 'tasks', pull: true, put: true }"
      :animation="150"
      ghost-class="opacity-40"
      drag-class="shadow-xl"
      handle=".drag-handle"
      :data-status="column.status"
      class="flex flex-col gap-2 min-h-[120px] rounded-lg p-2 bg-muted/20 border border-border/40 transition-colors"
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
