<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bookmark, Plus, ArrowLeft, Search, Star, Loader2 } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import { useBookmarkStore } from '@/stores/bookmarks'
import { useToast } from '@/composables/useToast'
import BookmarkCollectionCard from '@/features/bookmarks/components/BookmarkCollectionCard.vue'
import BookmarkCollectionForm from '@/features/bookmarks/components/BookmarkCollectionForm.vue'
import BookmarkListItem from '@/features/bookmarks/components/BookmarkListItem.vue'
import BookmarkForm from '@/features/bookmarks/components/BookmarkForm.vue'
import type { BookmarkCollection, Bookmark as BookmarkType } from '@/types/bookmarks'

const collectionStore = useBookmarkCollectionStore()
const bookmarkStore = useBookmarkStore()
const toast = useToast()

// ── Collection form state ───────────────────────────────────────────────────
const collectionFormOpen = ref(false)
const editingCollection = ref<BookmarkCollection | null>(null)

// ── Bookmark form state ─────────────────────────────────────────────────────
const bookmarkFormOpen = ref(false)
const editingBookmark = ref<BookmarkType | null>(null)

// ── Active collection (View B) ──────────────────────────────────────────────
const activeCollection = computed(() =>
  collectionStore.collections.find((c) => c.id === bookmarkStore.activeCollectionId) ?? null,
)

const isViewB = computed(() => bookmarkStore.activeCollectionId !== null)

// ── Search ──────────────────────────────────────────────────────────────────
const searchInput = ref('')
const debouncedSearch = useDebounceFn((term: string) => {
  bookmarkStore.setSearch(term)
}, 300)

function handleSearch(e: Event) {
  const term = (e.target as HTMLInputElement).value
  searchInput.value = term
  debouncedSearch(term)
}

// ── Navigation ──────────────────────────────────────────────────────────────
async function enterCollection(collection: BookmarkCollection) {
  searchInput.value = ''
  await bookmarkStore.fetchBookmarks(collection.id)
}

function leaveCollection() {
  bookmarkStore.clearCollection()
  searchInput.value = ''
}

// ── Collection CRUD ─────────────────────────────────────────────────────────
function openNewCollection() {
  editingCollection.value = null
  collectionFormOpen.value = true
}

function openEditCollection(collection: BookmarkCollection) {
  editingCollection.value = collection
  collectionFormOpen.value = true
}

async function handleDeleteCollection(collection: BookmarkCollection) {
  try {
    if (bookmarkStore.activeCollectionId === collection.id) {
      bookmarkStore.clearCollection()
    }
    await collectionStore.deleteCollection(collection.id)
    toast.success('Coleção excluída')
  } catch {
    toast.error('Erro ao excluir coleção')
  }
}

// ── Bookmark CRUD ───────────────────────────────────────────────────────────
function openNewBookmark() {
  editingBookmark.value = null
  bookmarkFormOpen.value = true
}

function openEditBookmark(bookmark: BookmarkType) {
  editingBookmark.value = bookmark
  bookmarkFormOpen.value = true
}

onMounted(async () => {
  await collectionStore.fetchCollections()
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- ── VIEW A — Grid de coleções ───────────────────────────────────── -->
    <template v-if="!isViewB">
      <!-- Header -->
      <div class="px-5 pt-6 pb-4 shrink-0">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              PESSOAL
            </p>
            <h1 class="text-[28px] font-bold text-foreground leading-none">Bookmarks</h1>
            <p class="text-[13px] text-muted-foreground mt-1.5">
              Seus links organizados por coleção
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity mt-1"
            @click="openNewCollection"
          >
            <Plus :size="14" />
            Nova coleção
          </button>
        </div>
      </div>

      <!-- Grid de coleções -->
      <div class="flex-1 overflow-y-auto px-4 pb-6">

        <!-- Loading -->
        <div v-if="collectionStore.isLoading" class="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 :size="18" class="animate-spin mr-2" />
          <span class="text-[13px]">Carregando...</span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="collectionStore.collections.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <span class="size-14 rounded-xl bg-muted grid place-items-center mb-4">
            <Bookmark :size="26" class="text-muted-foreground" />
          </span>
          <p class="text-[15px] font-semibold text-muted-foreground">Crie sua primeira coleção</p>
          <p class="text-[13px] text-muted-foreground mt-1 mb-5">Organize seus links em pastas</p>
          <button
            type="button"
            class="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
            @click="openNewCollection"
          >
            <Plus :size="14" />
            Nova coleção
          </button>
        </div>

        <!-- Collection grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <BookmarkCollectionCard
            v-for="collection in collectionStore.collections"
            :key="collection.id"
            :collection="collection"
            @click="enterCollection(collection)"
            @edit="openEditCollection(collection)"
            @delete="handleDeleteCollection(collection)"
          />
        </div>
      </div>
    </template>

    <!-- ── VIEW B — Lista de links ──────────────────────────────────────── -->
    <template v-else>
      <!-- Header da coleção -->
      <div class="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div class="flex items-center gap-3 mb-3">
          <button
            type="button"
            class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 -ml-1 px-1 py-1 rounded-lg hover:bg-muted"
            @click="leaveCollection"
          >
            <ArrowLeft :size="16" />
            <span class="text-[13px] font-medium">Bookmarks</span>
          </button>
          <div class="flex-1 min-w-0">
            <h2 class="text-[20px] font-bold text-foreground truncate leading-snug">
              {{ activeCollection?.name ?? 'Bookmarks' }}
            </h2>
            <p class="text-[12px] text-muted-foreground">
              {{ activeCollection?.bookmarks_count ?? 0 }}
              {{ activeCollection?.bookmarks_count === 1 ? 'link' : 'links' }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
            @click="openNewBookmark"
          >
            <Plus :size="14" />
            <span class="hidden sm:inline">Adicionar</span>
          </button>
        </div>

        <!-- Search + favorites -->
        <div class="flex items-center gap-2">
          <div class="flex-1 relative">
            <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              :value="searchInput"
              type="search"
              placeholder="Buscar links..."
              class="w-full h-9 pl-8 pr-3 rounded-xl bg-muted text-[13px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
              @input="handleSearch"
            />
          </div>
          <button
            type="button"
            class="size-9 rounded-xl flex items-center justify-center transition-colors"
            :class="bookmarkStore.showFavoritesOnly
              ? 'bg-muted text-warning'
              : 'bg-muted text-muted-foreground hover:text-muted-foreground '"
            @click="bookmarkStore.toggleFavoritesFilter()"
          >
            <Star :size="14" :class="bookmarkStore.showFavoritesOnly ? 'fill-warning' : ''" />
          </button>
        </div>
      </div>

      <!-- Bookmark list -->
      <div class="flex-1 overflow-y-auto px-4 py-2">
        <!-- Loading -->
        <div v-if="bookmarkStore.isLoading" class="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 :size="18" class="animate-spin mr-2" />
          <span class="text-[13px]">Carregando...</span>
        </div>

        <!-- Empty: no links yet -->
        <div
          v-else-if="!bookmarkStore.isLoading && bookmarkStore.filteredBookmarks.length === 0 && !searchInput && !bookmarkStore.showFavoritesOnly"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <span class="size-12 rounded-xl bg-muted grid place-items-center mb-3">
            <Bookmark :size="22" class="text-muted-foreground" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground">Nenhum link ainda</p>
          <p class="text-[12px] text-muted-foreground mt-1 mb-4">Adicione o primeiro link desta coleção</p>
          <button
            type="button"
            class="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
            @click="openNewBookmark"
          >
            <Plus :size="14" />
            Adicionar link
          </button>
        </div>

        <!-- Empty: search/filter with no results -->
        <div
          v-else-if="!bookmarkStore.isLoading && bookmarkStore.filteredBookmarks.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <span class="size-12 rounded-xl bg-muted grid place-items-center mb-3">
            <Search :size="22" class="text-muted-foreground" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground">Nenhum resultado</p>
          <p class="text-[12px] text-muted-foreground mt-1">Tente outros termos ou limpe o filtro</p>
        </div>

        <!-- Bookmark list -->
        <div v-else>
          <BookmarkListItem
            v-for="bookmark in bookmarkStore.filteredBookmarks"
            :key="bookmark.id"
            :bookmark="bookmark"
            @edit="openEditBookmark"
          />
        </div>
      </div>
    </template>

    <!-- ── Sheets ─────────────────────────────────────────────────────────── -->
    <BookmarkCollectionForm
      v-model:open="collectionFormOpen"
      :collection="editingCollection"
    />

    <BookmarkForm
      v-if="bookmarkStore.activeCollectionId"
      v-model:open="bookmarkFormOpen"
      :collection-id="bookmarkStore.activeCollectionId"
      :bookmark="editingBookmark"
    />
  </div>
</template>
