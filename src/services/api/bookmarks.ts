import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type {
  Bookmark,
  BookmarkCategory,
  BookmarkCollection,
  CreateBookmarkCategoryPayload,
  CreateBookmarkCollectionPayload,
  CreateBookmarkPayload,
  ReorderItem,
  UpdateBookmarkCategoryPayload,
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

  categories: {
    list: (collectionId: string) =>
      client
        .get<ApiResponse<BookmarkCategory[]>>(API_ENDPOINTS.BOOKMARKS.CATEGORIES(collectionId))
        .then(unwrap),

    create: (collectionId: string, payload: CreateBookmarkCategoryPayload) =>
      client
        .post<ApiResponse<BookmarkCategory>>(API_ENDPOINTS.BOOKMARKS.CATEGORIES(collectionId), payload)
        .then(unwrap),

    update: (id: string, payload: UpdateBookmarkCategoryPayload) =>
      client
        .put<ApiResponse<BookmarkCategory>>(API_ENDPOINTS.BOOKMARKS.CATEGORY_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client.delete(API_ENDPOINTS.BOOKMARKS.CATEGORY_DETAIL(id)),

    reorder: (collectionId: string, items: ReorderItem[]) =>
      client
        .post<ApiResponse<unknown>>(API_ENDPOINTS.BOOKMARKS.CATEGORIES_REORDER(collectionId), { items })
        .then(unwrap),
  },

  bookmarks: {
    list: (categoryId: string, params?: { search?: string; favorites?: boolean }) =>
      client
        .get<ApiResponse<Bookmark[]>>(API_ENDPOINTS.BOOKMARKS.BOOKMARKS(categoryId), { params })
        .then(unwrap),

    create: (categoryId: string, payload: CreateBookmarkPayload) =>
      client
        .post<ApiResponse<Bookmark>>(API_ENDPOINTS.BOOKMARKS.BOOKMARKS(categoryId), payload)
        .then(unwrap),

    update: (id: string, payload: UpdateBookmarkPayload) =>
      client
        .put<ApiResponse<Bookmark>>(API_ENDPOINTS.BOOKMARKS.BOOKMARK_DETAIL(id), payload)
        .then(unwrap),

    delete: (id: string) =>
      client.delete(API_ENDPOINTS.BOOKMARKS.BOOKMARK_DETAIL(id)),

    toggleFavorite: (id: string) =>
      client
        .patch<ApiResponse<Bookmark>>(API_ENDPOINTS.BOOKMARKS.BOOKMARK_FAVORITE(id))
        .then(unwrap),

    reorder: (categoryId: string, items: ReorderItem[]) =>
      client
        .post<ApiResponse<unknown>>(API_ENDPOINTS.BOOKMARKS.BOOKMARKS_REORDER(categoryId), { items })
        .then(unwrap),
  },
}
