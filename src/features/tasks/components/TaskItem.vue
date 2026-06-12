<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Repeat } from 'lucide-vue-next'
import type { Task } from '@/types/tasks'
import { isTaskOverdue, isTaskDueToday, isTaskDueTomorrow, formatDueDateShort } from '../utils/taskHelpers'

const props = defineProps<{
  task: Task
  showTime?: boolean   // default true — pass false in period view (time shown externally)
  noBorder?: boolean   // default false — pass true when wrapper provides the border
}>()

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
const displayTime = computed(() => props.showTime !== false)

const checkboxStyle = computed(() => {
  switch (props.task.priority) {
    case 'urgent': return 'border-color: hsl(var(--destructive))'
    case 'high':   return 'border-color: hsl(38 90% 60%)'
    case 'normal': return 'border-color: hsl(var(--warning))'
    case 'low':    return 'border-color: hsl(var(--muted-foreground) / 0.4)'
    default:       return 'border-color: hsl(var(--border))'
  }
})
</script>

<template>
  <div
    class="group flex items-center transition-colors hover:bg-muted/20"
    :class="[
      noBorder ? '' : 'border-b border-border/30 last:border-0',
      (isCompleted || isCancelled) ? 'opacity-60' : '',
    ]"
  >
    <!-- Checkbox — large touch target -->
    <button
      type="button"
      class="size-11 flex items-center justify-center shrink-0 -ml-1 rounded-full transition-all active:scale-95"
      :disabled="isCancelled"
      :aria-label="isCompleted ? 'Desmarcar tarefa' : 'Concluir tarefa'"
      @click.stop="emit('toggle', task.id)"
    >
      <!-- Completed: solid check icon -->
      <CheckCircle2 v-if="isCompleted" :size="20" class="text-success" />
      <!-- Pending: priority-coloured ring -->
      <span
        v-else
        class="size-5 rounded-full border-2 transition-all"
        :style="checkboxStyle"
      />
    </button>

    <!-- Content — opens detail sheet -->
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
        >
          {{ task.title }}
          <Repeat
            v-if="task.recurrence_type && task.recurrence_type !== 'none'"
            :size="11"
            class="inline ml-1 mb-0.5 align-middle"
            style="color: hsl(var(--primary) / 0.5)"
          />
        </p>
        <div class="flex items-center gap-1.5 mt-0.5">
          <p
            v-if="task.description"
            class="text-[12px] text-muted-foreground/60 truncate"
          >{{ task.description }}</p>
          <span
            v-else-if="task.task_list"
            class="text-[11px] text-muted-foreground/40"
          >{{ task.task_list.name }}</span>
        </div>
      </div>

      <!-- Right: badges in two rows -->
      <div class="flex flex-col items-end gap-0.5 shrink-0">
        <!-- Top row: priority badge + subtask count -->
        <div class="flex items-center gap-1">
          <span
            v-if="task.priority === 'urgent' && !isCompleted"
            class="text-[10px] rounded-full px-1.5 py-0.5 bg-destructive/15 text-destructive font-medium"
          >P1</span>
          <span
            v-else-if="task.priority === 'high' && !isCompleted"
            class="text-[10px] rounded-full px-1.5 py-0.5 font-medium"
            style="background: hsl(38 90% 60% / 0.15); color: hsl(38 90% 60%)"
          >P2</span>
          <span
            v-if="task.subtasks_count > 0"
            class="text-[10px] tabular-nums text-muted-foreground/50"
          >{{ task.completed_subtasks_count }}/{{ task.subtasks_count }}</span>
        </div>

        <!-- Bottom row: time + date -->
        <div class="flex items-center gap-1">
          <span
            v-if="task.due_time && displayTime"
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
