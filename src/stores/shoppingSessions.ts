import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { shoppingApi } from '@/services/api/shopping'
import type { ShoppingSession, FinishSessionPayload } from '@/types/shopping'

export const useShoppingSessionStore = defineStore('shoppingSessions', () => {
  const sessions = ref<ShoppingSession[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeSession = computed<ShoppingSession | null>(
    () => sessions.value.find((s) => s.status === 'active') ?? null,
  )

  const finishedSessions = computed<ShoppingSession[]>(() =>
    sessions.value
      .filter((s) => s.status === 'finished')
      .sort((a, b) => {
        const aTime = a.finished_at ? new Date(a.finished_at).getTime() : 0
        const bTime = b.finished_at ? new Date(b.finished_at).getTime() : 0
        return bTime - aTime
      }),
  )

  async function fetchSessions(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      sessions.value = await shoppingApi.sessions.list()
    } catch {
      error.value = 'Erro ao carregar sessões de compra'
    } finally {
      loading.value = false
    }
  }

  async function createSession(title: string): Promise<ShoppingSession> {
    try {
      const session = await shoppingApi.sessions.create({ title })
      sessions.value.unshift(session)
      return session
    } catch (e) {
      error.value = 'Erro ao criar sessão'
      throw e
    }
  }

  async function fetchSession(id: string): Promise<ShoppingSession> {
    try {
      const session = await shoppingApi.sessions.get(id)
      const idx = sessions.value.findIndex((s) => s.id === id)
      if (idx !== -1) {
        sessions.value[idx] = session
      } else {
        sessions.value.unshift(session)
      }
      return session
    } catch (e) {
      error.value = 'Erro ao carregar sessão'
      throw e
    }
  }

  async function finishSession(id: string, payload: FinishSessionPayload): Promise<ShoppingSession> {
    try {
      const session = await shoppingApi.sessions.finish(id, payload)
      const idx = sessions.value.findIndex((s) => s.id === id)
      if (idx !== -1) sessions.value[idx] = session
      return session
    } catch (e) {
      error.value = 'Erro ao finalizar sessão'
      throw e
    }
  }

  async function updateSession(id: string, payload: { title?: string }): Promise<void> {
    const idx = sessions.value.findIndex((s) => s.id === id)
    if (idx !== -1) Object.assign(sessions.value[idx]!, payload)
    try {
      const session = await shoppingApi.sessions.update(id, payload as { title: string })
      const currentIdx = sessions.value.findIndex((s) => s.id === id)
      if (currentIdx !== -1) sessions.value[currentIdx] = session
    } catch (e) {
      error.value = 'Erro ao atualizar sessão'
      throw e
    }
  }

  async function reopenSession(id: string): Promise<void> {
    const idx = sessions.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      sessions.value[idx]!.status = 'active'
      sessions.value[idx]!.finished_at = null
      sessions.value[idx]!.total = null
      sessions.value[idx]!.transaction_id = null
    }
    try {
      const session = await shoppingApi.sessions.reopen(id)
      const currentIdx = sessions.value.findIndex((s) => s.id === id)
      if (currentIdx !== -1) sessions.value[currentIdx] = session
    } catch (e) {
      error.value = 'Erro ao reabrir sessão'
      throw e
    }
  }

  async function deleteSession(id: string): Promise<void> {
    try {
      await shoppingApi.sessions.delete(id)
      const idx = sessions.value.findIndex((s) => s.id === id)
      if (idx !== -1) sessions.value.splice(idx, 1)
    } catch (e) {
      error.value = 'Erro ao excluir sessão'
      throw e
    }
  }

  function updateSessionItems(sessionId: string, updater: (s: ShoppingSession) => void): void {
    const idx = sessions.value.findIndex((s) => s.id === sessionId)
    if (idx !== -1) updater(sessions.value[idx]!)
  }

  return {
    sessions,
    loading,
    error,
    activeSession,
    finishedSessions,
    fetchSessions,
    createSession,
    fetchSession,
    finishSession,
    updateSession,
    reopenSession,
    deleteSession,
    updateSessionItems,
  }
})
