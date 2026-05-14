import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { notesApi } from '@/services/api/notes'
import type { Note, NoteTag, CreateNotePayload, UpdateNotePayload, NoteFilters } from '@/types/notes'

export const useNoteStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const tags = ref<NoteTag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pinnedNotes = computed(() => notes.value.filter((n) => n.is_pinned && !n.is_archived))
  const favoriteNotes = computed(() => notes.value.filter((n) => n.is_favorite && !n.is_archived))
  const archivedNotes = computed(() => notes.value.filter((n) => n.is_archived))
  const activeNotes = computed(() => notes.value.filter((n) => !n.is_archived))

  async function fetchNotes(filters?: NoteFilters) {
    loading.value = true
    error.value = null
    try {
      const data = await notesApi.list(filters)
      if (filters?.archived) {
        notes.value = [
          ...notes.value.filter((n) => !n.is_archived),
          ...(data as Note[]),
        ]
      } else {
        notes.value = [
          ...(data as Note[]),
          ...notes.value.filter((n) => n.is_archived),
        ]
      }
    } catch {
      error.value = 'Erro ao carregar notas'
    } finally {
      loading.value = false
    }
  }

  async function fetchTags() {
    tags.value = await notesApi.tags.list() as NoteTag[]
  }

  async function createNote(payload: CreateNotePayload): Promise<Note> {
    const note = await notesApi.create(payload) as Note
    notes.value.unshift(note)
    return note
  }

  async function updateNote(id: string, payload: UpdateNotePayload): Promise<Note> {
    const updated = await notesApi.update(id, payload) as Note
    const idx = notes.value.findIndex((n) => n.id === id)
    if (idx !== -1) notes.value[idx] = updated
    return updated
  }

  async function deleteNote(id: string): Promise<void> {
    await notesApi.delete(id)
    notes.value = notes.value.filter((n) => n.id !== id)
  }

  async function togglePin(id: string): Promise<Note> {
    const note = notes.value.find((n) => n.id === id)
    if (!note) throw new Error('Note not found')
    const pinned = !note.is_pinned
    const idx = notes.value.findIndex((n) => n.id === id)
    notes.value[idx] = { ...note, is_pinned: pinned }
    try {
      const updated = await notesApi.pin(id, pinned) as Note
      notes.value[idx] = updated
      return updated
    } catch {
      notes.value[idx] = { ...note, is_pinned: !pinned }
      throw new Error('Erro ao fixar nota')
    }
  }

  async function toggleFavorite(id: string): Promise<Note> {
    const note = notes.value.find((n) => n.id === id)
    if (!note) throw new Error('Note not found')
    const favorited = !note.is_favorite
    const idx = notes.value.findIndex((n) => n.id === id)
    notes.value[idx] = { ...note, is_favorite: favorited }
    try {
      const updated = await notesApi.favorite(id, favorited) as Note
      notes.value[idx] = updated
      return updated
    } catch {
      notes.value[idx] = { ...note, is_favorite: !favorited }
      throw new Error('Erro ao favoritar nota')
    }
  }

  async function archiveNote(id: string): Promise<void> {
    const updated = await notesApi.archive(id) as Note
    const idx = notes.value.findIndex((n) => n.id === id)
    if (idx !== -1) notes.value[idx] = updated
  }

  async function unarchiveNote(id: string): Promise<void> {
    const updated = await notesApi.unarchive(id) as Note
    const idx = notes.value.findIndex((n) => n.id === id)
    if (idx !== -1) notes.value[idx] = updated
  }

  async function createTag(payload: { name: string; color?: string }): Promise<NoteTag> {
    const tag = await notesApi.tags.create(payload) as NoteTag
    tags.value.push(tag)
    tags.value.sort((a, b) => a.name.localeCompare(b.name))
    return tag
  }

  async function deleteTag(id: string): Promise<void> {
    await notesApi.tags.delete(id)
    tags.value = tags.value.filter((t) => t.id !== id)
    notes.value = notes.value.map((n) => ({
      ...n,
      tags: n.tags.filter((t) => t.id !== id),
    }))
  }

  return {
    notes,
    tags,
    loading,
    error,
    pinnedNotes,
    favoriteNotes,
    archivedNotes,
    activeNotes,
    fetchNotes,
    fetchTags,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleFavorite,
    archiveNote,
    unarchiveNote,
    createTag,
    deleteTag,
  }
})
