import { ref } from 'vue'
import { useShoppingSessionStore } from '@/stores/shoppingSessions'
import { useToast } from '@/composables/useToast'
import type { ShoppingSession } from '@/types/shopping'

export function useShoppingSession() {
  const store = useShoppingSessionStore()
  const toast = useToast()

  const sessionViewOpen = ref(false)
  const finishSheetOpen = ref(false)
  const newSessionDialogOpen = ref(false)
  const deleteConfirmOpen = ref(false)
  const sessionToDelete = ref<ShoppingSession | null>(null)
  const detailSheetOpen = ref(false)
  const selectedHistorySession = ref<ShoppingSession | null>(null)
  const reopenConfirmOpen = ref(false)
  const sessionToReopen = ref<ShoppingSession | null>(null)

  function openSessionView() {
    sessionViewOpen.value = true
  }

  function openFinishSheet() {
    finishSheetOpen.value = true
  }

  function openNewSessionDialog() {
    newSessionDialogOpen.value = true
  }

  function requestDeleteSession(session: ShoppingSession) {
    sessionToDelete.value = session
    deleteConfirmOpen.value = true
  }

  async function confirmDeleteSession() {
    if (!sessionToDelete.value) return
    try {
      await store.deleteSession(sessionToDelete.value.id)
      toast.success('Lista removida')
    } catch {
      toast.error('Erro ao remover lista')
    } finally {
      deleteConfirmOpen.value = false
      sessionToDelete.value = null
    }
  }

  function cancelDeleteSession() {
    deleteConfirmOpen.value = false
    sessionToDelete.value = null
  }

  function openHistoryDetail(session: ShoppingSession) {
    selectedHistorySession.value = session
    detailSheetOpen.value = true
  }

  function requestReopenSession(session: ShoppingSession) {
    sessionToReopen.value = session
    reopenConfirmOpen.value = true
  }

  async function confirmReopenSession() {
    if (!sessionToReopen.value) return
    try {
      await store.reopenSession(sessionToReopen.value.id)
      toast.success('Lista reaberta!')
    } catch {
      toast.error('Erro ao reabrir lista')
    } finally {
      reopenConfirmOpen.value = false
      sessionToReopen.value = null
    }
  }

  function cancelReopenSession() {
    reopenConfirmOpen.value = false
    sessionToReopen.value = null
  }

  function handleSessionReopened() {
    selectedHistorySession.value = null
    detailSheetOpen.value = false
  }

  return {
    sessionViewOpen,
    finishSheetOpen,
    newSessionDialogOpen,
    deleteConfirmOpen,
    sessionToDelete,
    detailSheetOpen,
    selectedHistorySession,
    reopenConfirmOpen,
    sessionToReopen,
    openSessionView,
    openFinishSheet,
    openNewSessionDialog,
    requestDeleteSession,
    confirmDeleteSession,
    cancelDeleteSession,
    openHistoryDetail,
    requestReopenSession,
    confirmReopenSession,
    cancelReopenSession,
    handleSessionReopened,
  }
}
