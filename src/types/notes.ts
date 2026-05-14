export interface NoteTag {
  id: string
  name: string
  color: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string | null
  is_pinned: boolean
  is_favorite: boolean
  is_archived: boolean
  archived_at: string | null
  last_viewed_at: string | null
  tags: NoteTag[]
  created_at: string
  updated_at: string
}

export interface CreateNotePayload {
  title?: string
  content?: string
  is_pinned?: boolean
  is_favorite?: boolean
  tag_ids?: string[]
}

export type UpdateNotePayload = Partial<CreateNotePayload>

export interface NoteFilters {
  search?: string
  tag_id?: string
  is_pinned?: boolean
  is_favorite?: boolean
  archived?: boolean
}

export type NoteViewId = 'all' | 'favorites' | 'pinned' | 'archived' | `tag:${string}`
