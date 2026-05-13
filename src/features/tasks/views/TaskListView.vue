<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button'
import { Plus } from 'lucide-vue-next'
import TaskList from '../components/TaskList.vue'
import type { Task } from '@/types/tasks'
import { sortTasks } from '../utils/taskHelpers'
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

const sorted = computed(() =>
  sortTasks(props.tasks, props.sortField ?? 'order', props.sortDirection ?? 'asc'),
)
</script>

<template>
  <TaskList
    :tasks="sorted"
    :loading="loading"
    empty-title="Nenhuma tarefa encontrada"
    empty-description="Crie uma nova tarefa ou ajuste os filtros para ver resultados."
    draggable
    @toggle="emit('toggle', $event)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @archive="emit('archive', $event)"
    @open="emit('open', $event)"
    @reorder="emit('reorder', $event)"
  >
    <template #empty-action>
      <Button size="sm" @click="emit('create')">
        <Plus :size="14" class="mr-1.5" />
        Nova tarefa
      </Button>
    </template>
  </TaskList>
</template>
