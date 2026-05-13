import { useTaskStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'
import type { TaskStatus } from '@/types/tasks'

export function useTaskDnd() {
  const store = useTaskStore()
  const toast = useToast()

  // Called after drag ends inside the same list (reorder)
  async function onListReorder(ids: string[]) {
    try {
      await store.reorderTasks(ids)
    } catch {
      toast.error('Erro ao reordenar tarefas')
    }
  }

  // Called when a card is dropped into a different kanban column
  async function onKanbanDrop(taskId: string, newStatus: TaskStatus) {
    try {
      await store.changeStatus(taskId, newStatus)
    } catch {
      toast.error('Erro ao mover tarefa')
    }
  }

  return { onListReorder, onKanbanDrop }
}
