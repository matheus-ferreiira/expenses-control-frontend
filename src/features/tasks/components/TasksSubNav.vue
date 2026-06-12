<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { isTaskOverdue } from '@/features/tasks/utils/taskHelpers'
import type { TaskViewId } from '@/features/tasks/types'

const props = defineProps<{
  selectedView: TaskViewId
}>()

const emit = defineEmits<{
  'update:selectedView': [view: TaskViewId]
}>()

const store = useTaskStore()

function todayStr() {
  return new Date().toLocaleDateString('en-CA')
}
function addDaysStr(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

const counts = computed(() => {
  const tasks = store.tasks
  const today = todayStr()
  const nextWeek = addDaysStr(7)
  return {
    all:       tasks.filter((t) => t.status !== 'cancelled' && t.status !== 'completed').length,
    today:     tasks.filter((t) => t.due_date === today && t.status !== 'completed' && t.status !== 'cancelled').length,
    upcoming:  tasks.filter((t) => t.due_date && t.due_date > today && t.due_date <= nextWeek && t.status !== 'completed' && t.status !== 'cancelled').length,
    overdue:   tasks.filter((t) => isTaskOverdue(t)).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }
})

const tabs = computed(() => [
  { id: 'all' as TaskViewId,       label: 'Todas',      count: counts.value.all,       danger: false },
  { id: 'today' as TaskViewId,     label: 'Hoje',       count: counts.value.today,     danger: false },
  { id: 'upcoming' as TaskViewId,  label: 'Próximas',   count: counts.value.upcoming,  danger: false },
  { id: 'overdue' as TaskViewId,   label: 'Atrasadas',  count: counts.value.overdue,   danger: true  },
  { id: 'completed' as TaskViewId, label: 'Concluídas', count: counts.value.completed, danger: false },
])

function isActive(id: TaskViewId): boolean {
  if (props.selectedView === id) return true
  if (id === 'all' && !['today', 'upcoming', 'overdue', 'completed', 'no-date'].includes(props.selectedView)) return true
  return false
}

function tabClass(tab: { id: TaskViewId; danger: boolean; count: number }): string {
  if (isActive(tab.id) && tab.danger) return 'bg-destructive/15 text-destructive font-medium'
  if (isActive(tab.id)) return 'bg-primary/15 text-primary font-medium'
  if (tab.danger && tab.count > 0) return 'text-destructive/70 hover:text-destructive'
  return 'text-muted-foreground hover:text-foreground'
}

function countClass(tab: { danger: boolean }, active: boolean): string {
  if (tab.danger && active) return 'text-destructive/70'
  if (tab.danger) return 'text-destructive'
  return 'opacity-60'
}
</script>

<template>
  <div class="-mx-4 px-4 mb-4 overflow-x-auto scrollbar-none">
    <div class="flex items-center gap-1.5 w-max py-0.5">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors shrink-0"
        :class="tabClass(tab)"
        @click="emit('update:selectedView', tab.id)"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="text-[11px] tabular-nums font-semibold"
          :class="countClass(tab, isActive(tab.id))"
        >{{ tab.count }}</span>
      </button>
    </div>
  </div>
</template>
