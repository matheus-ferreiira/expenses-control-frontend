<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/tasks'
import { isTaskOverdue, isTaskDueToday, isTaskDueTomorrow, formatDueDateShort } from '../utils/taskHelpers'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{
  toggle: [id: string]
  open: [task: Task]
}>()

const isCompleted = computed(() => props.task.status === 'completed')
const isCancelled = computed(() => props.task.status === 'cancelled')
const overdue = computed(() => isTaskOverdue(props.task))
const dueToday = computed(() => isTaskDueToday(props.task))
const dueTomorrow = computed(() => isTaskDueTomorrow(props.task))
const dueDateLabel = computed(() => formatDueDateShort(props.task.due_date))

// Checkbox border/bg colour via CSS vars to avoid hardcoded hex
const checkboxStyle = computed(() => {
  if (isCompleted.value) {
    return 'border-color: hsl(var(--success) / 0.8); background: hsl(var(--success) / 0.8)'
  }
  switch (props.task.priority) {
    case 'urgent': return 'border-color: hsl(var(--destructive))'
    case 'high':   return 'border-color: hsl(var(--warning))'
    case 'normal': return 'border-color: hsl(var(--muted-foreground) / 0.55)'
    case 'low':    return 'border-color: hsl(var(--muted-foreground) / 0.35)'
    default:       return 'border-color: hsl(var(--muted-foreground) / 0.35)'
  }
})
</script>

<template>
  <div
    class="group flex items-center border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20"
    :class="(isCompleted || isCancelled) && 'opacity-60'"
  >
    <!-- Checkbox — large touch area -->
    <button
      type="button"
      class="size-11 flex items-center justify-center shrink-0 -ml-1 rounded-full transition-all active:scale-95"
      :disabled="isCancelled"
      :aria-label="isCompleted ? 'Desmarcar tarefa' : 'Concluir tarefa'"
      @click.stop="emit('toggle', task.id)"
    >
      <span
        class="size-5 rounded-full border-2 flex items-center justify-center transition-all"
        :style="checkboxStyle"
      >
        <svg
          v-if="isCompleted"
          viewBox="0 0 10 10"
          class="w-2.5 h-2.5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="color: hsl(var(--background))"
        >
          <polyline points="1.5,5 4,7.5 8.5,2.5" />
        </svg>
      </span>
    </button>

    <!-- Content — clickable opens detail sheet -->
    <div
      class="flex-1 min-w-0 flex items-center gap-2 py-3 pr-3 cursor-pointer"
      @click="emit('open', task)"
    >
      <!-- Left: title + secondary meta -->
      <div class="flex-1 min-w-0">
        <p
          class="text-[14px] font-medium leading-snug truncate"
          :class="isCompleted || isCancelled
            ? 'line-through text-muted-foreground/50'
            : 'text-foreground'"
        >{{ task.title }}</p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <p
            v-if="task.description"
            class="text-[12px] text-muted-foreground/60 truncate"
          >{{ task.description }}</p>
          <!-- List name as secondary meta when no description -->
          <span
            v-else-if="task.task_list"
            class="text-[11px] text-muted-foreground/40"
          >{{ task.task_list.name }}</span>
        </div>
      </div>

      <!-- Right: badges in two rows -->
      <div class="flex flex-col items-end gap-0.5 shrink-0">
        <!-- Top row: priority + subtask count -->
        <div class="flex items-center gap-1">
          <span
            v-if="task.priority === 'urgent'"
            class="text-[10px] rounded-full px-1.5 py-0.5 bg-destructive/15 text-destructive font-medium"
          >P1</span>
          <span
            v-else-if="task.priority === 'high'"
            class="text-[10px] rounded-full px-1.5 py-0.5 bg-warning/15 text-warning font-medium"
          >P2</span>
          <!-- Subtask progress -->
          <span
            v-if="task.subtasks_count > 0"
            class="text-[10px] tabular-nums text-muted-foreground/50"
          >{{ task.completed_subtasks_count }}/{{ task.subtasks_count }}</span>
        </div>

        <!-- Bottom row: time + date -->
        <div class="flex items-center gap-1">
          <span
            v-if="task.due_time"
            class="text-[11px] tabular-nums text-muted-foreground/60"
          >{{ task.due_time.slice(0, 5) }}</span>

          <template v-if="task.due_date">
            <span
              v-if="overdue"
              class="text-[11px] font-medium text-destructive"
            >Atrasada</span>
            <span
              v-else-if="dueToday"
              class="text-[11px] font-medium text-warning"
            >Hoje</span>
            <span
              v-else-if="dueTomorrow"
              class="text-[11px] font-medium"
              style="color: hsl(var(--primary) / 0.8)"
            >Amanhã</span>
            <span
              v-else
              class="text-[11px] text-muted-foreground/50 tabular-nums"
            >{{ dueDateLabel }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
