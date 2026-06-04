import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type {
  Bookmark,
  BookmarkCollection,
  CreateBookmarkCollectionPayload,
  CreateBookmarkPayload,
  ReorderItem,
  UpdateBookmarkCollectionPayload,
  UpdateBookmarkPayload,
} from '@/types/bookmarks'

export const bookmarksApi = {
  collections: {
    list: () =>
      client
        .get<ApiResponse<BookmarkCollection[]>>(API_ENDPOINTS.BOOKMARKS.COLLECTIONS)
        .then(unwrap),

    create: (payload: CreateBookmarkCollectionPayload) =>
      client
        .post<ApiResponse<BookmarkCollection>>(API_ENDPOINTS.BOOKMARKS.COLLECTIONS, payload)
        .then(unwrap),

    update: (id: string, payload: UpdateBookmarkCollectionPayload) =>
      client
        .put<ApiResponse<BookmarkCollection>>(API_ENDPOINTS.BOOKMARKS.COLLECTION_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client.delete(API_ENDPOINTS.BOOKMARKS.COLLECTION_DETAIL(id)),

    reorder: (items: ReorderItem[]) =>
      client
        .post<ApiResponse<unknown>>(API_ENDPOINTS.BOOKMARKS.COLLECTIONS_REORDER, { items })
        .then(unwrap),
  },

  links: {
    list: (collectionId: string, params?: { search?: string; favorites?: boolean }) =>
      client
        .get<ApiResponse<Bookmark[]>>(API_ENDPOINTS.BOOKMARKS.LINKS(collectionId), { params })
        .then(unwrap),

    create: (collectionId: string, payload: CreateBookmarkPayload) =>
      client
        .post<ApiResponse<Bookmark>>(API_ENDPOINTS.BOOKMARKS.LINKS(collectionId), payload)
        .then(unwrap),

    update: (id: string, payload: UpdateBookmarkPayload) =>
      client
        .put<ApiResponse<Bookmark>>(API_ENDPOINTS.BOOKMARKS.LINK_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client.delete(API_ENDPOINTS.BOOKMARKS.LINK_DETAIL(id)),

    toggleFavorite: (id: string) =>
      client
        .patch<ApiResponse<Bookmark>>(API_ENDPOINTS.BOOKMARKS.LINK_FAVORITE(id))
        .then(unwrap),

    reorder: (collectionId: string, items: ReorderItem[]) =>
      client
        .post<ApiResponse<unknown>>(API_ENDPOINTS.BOOKMARKS.LINKS_REORDER(collectionId), { items })
        .then(unwrap),
  },
}
