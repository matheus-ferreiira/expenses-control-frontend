import { ref } from 'vue'
import { useShoppingSessionStore } from '@/stores/shoppingSessions'
import { useToast } from '@/composables/useToast'

export function useShoppingSession() {
  const store = useShoppingSessionStore()
  const toast = useToast()

  const sessionViewOpen = ref(false)
  const finishSheetOpen = ref(false)
  const newSessionDialogOpen = ref(false)

  function openSessionView() {
    sessionViewOpen.value = true
  }

  function openFinishSheet() {
    finishSheetOpen.value = true
  }

  function openNewSessionDialog() {
    newSessionDialogOpen.value = true
  }

  async function handleDeleteSession(id: string) {
    try {
      await store.deleteSession(id)
      toast.success('Lista removida')
    } catch {
      toast.error('Erro ao remover lista')
    }
  }

  return {
    sessionViewOpen,
    finishSheetOpen,
    newSessionDialogOpen,
    openSessionView,
    openFinishSheet,
    openNewSessionDialog,
    handleDeleteSession,
  }
}
