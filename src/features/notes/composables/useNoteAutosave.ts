import { ref } from 'vue'
import { useNoteStore } from '@/stores/notes'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useNoteAutosave(getNoteId: () => string | null) {
  const store = useNoteStore()
  const status = ref<SaveStatus>('idle')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function cancel() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  async function saveNow(title: string, content: string) {
    const id = getNoteId()
    if (!id) return
    status.value = 'saving'
    try {
      await store.updateNote(id, { title, content })
      status.value = 'saved'
      setTimeout(() => {
        if (status.value === 'saved') status.value = 'idle'
      }, 2000)
    } catch {
      status.value = 'error'
    }
  }

  function schedule(title: string, content: string) {
    cancel()
    status.value = 'saving'
    debounceTimer = setTimeout(() => saveNow(title, content), 600)
  }

  return { status, schedule, saveNow, cancel }
}
