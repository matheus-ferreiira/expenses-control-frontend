import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type { Note, NoteTag, CreateNotePayload, UpdateNotePayload, NoteFilters } from '@/types/notes'

export const notesApi = {
  list: (filters?: NoteFilters) =>
    client
      .get<ApiResponse<Note[]>>(API_ENDPOINTS.NOTES.BASE, { params: filters })
      .then(unwrap),

  get: (id: string) =>
    client.get<ApiResponse<Note>>(API_ENDPOINTS.NOTES.DETAIL(id)).then(unwrap),

  create: (payload: CreateNotePayload) =>
    client.post<ApiResponse<Note>>(API_ENDPOINTS.NOTES.BASE, payload).then(unwrap),

  update: (id: string, payload: UpdateNotePayload) =>
    client.patch<ApiResponse<Note>>(API_ENDPOINTS.NOTES.DETAIL(id), payload).then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.NOTES.DETAIL(id)).then(unwrap),

  pin: (id: string, pinned: boolean) =>
    client.patch<ApiResponse<Note>>(API_ENDPOINTS.NOTES.PIN(id), { pinned }).then(unwrap),

  favorite: (id: string, favorited: boolean) =>
    client.patch<ApiResponse<Note>>(API_ENDPOINTS.NOTES.FAVORITE(id), { favorited }).then(unwrap),

  archive: (id: string) =>
    client.patch<ApiResponse<Note>>(API_ENDPOINTS.NOTES.ARCHIVE(id)).then(unwrap),

  unarchive: (id: string) =>
    client.patch<ApiResponse<Note>>(API_ENDPOINTS.NOTES.UNARCHIVE(id)).then(unwrap),

  tags: {
    list: () =>
      client.get<ApiResponse<NoteTag[]>>(API_ENDPOINTS.NOTES.TAGS).then(unwrap),

    create: (payload: { name: string; color?: string }) =>
      client.post<ApiResponse<NoteTag>>(API_ENDPOINTS.NOTES.TAGS, payload).then(unwrap),

    update: (id: string, payload: { name?: string; color?: string }) =>
      client.put<ApiResponse<NoteTag>>(API_ENDPOINTS.NOTES.TAG_DETAIL(id), payload).then(unwrap),

    delete: (id: string) =>
      client.delete<ApiResponse<null>>(API_ENDPOINTS.NOTES.TAG_DETAIL(id)).then(unwrap),
  },
}
