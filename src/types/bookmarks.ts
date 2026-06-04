export interface BookmarkCollection {
  id: string
  name: string
  icon: string | null
  color: string | null
  position: number
  bookmarks_count: number
  created_at: string
}

export interface Bookmark {
  id: string
  bookmark_collection_id: string
  title: string
  url: string
  description: string | null
  is_favorite: boolean
  position: number
  favicon_url: string | null
  created_at: string
}

export interface CreateBookmarkCollectionPayload {
  name: string
  icon?: string | null
  color?: string | null
}

export interface UpdateBookmarkCollectionPayload {
  name?: string
  icon?: string | null
  color?: string | null
}

export interface CreateBookmarkPayload {
  title: string
  url: string
  description?: string | null
  is_favorite?: boolean
}

export interface UpdateBookmarkPayload {
  title?: string
  url?: string
  description?: string | null
  is_favorite?: boolean
  bookmark_collection_id?: string
}

export interface ReorderItem {
  id: string
  position: number
}
