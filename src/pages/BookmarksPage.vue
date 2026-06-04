<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bookmark, FolderOpen, Search, Star, Plus, Menu, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import { useBookmarkStore } from '@/stores/bookmarks'
import { useBookmarks } from '@/features/bookmarks/composables/useBookmarks'
import { useBookmarkCollections } from '@/features/bookmarks/composables/useBookmarkCollections'
import BookmarkCollectionSidebar from '@/features/bookmarks/components/BookmarkCollectionSidebar.vue'
import BookmarkCategoryTabs from '@/features/bookmarks/components/BookmarkCategoryTabs.vue'
import BookmarkListItem from '@/features/bookmarks/components/BookmarkListItem.vue'
import BookmarkAddDialog from '@/features/bookmarks/components/BookmarkAddDialog.vue'
import BookmarkEditDialog from '@/features/bookmarks/components/BookmarkEditDialog.vue'
import CollectionFormDialog from '@/features/bookmarks/components/CollectionFormDialog.vue'
import CategoryFormDialog from '@/features/bookmarks/components/CategoryFormDialog.vue'

const collectionStore = useBookmarkCollectionStore()
const bookmarkStore = useBookmarkStore()

const {
  addDialogOpen,
  editDialogOpen,
  editingBookmark,
  onSearch,
  toggleFavoritesFilter,
  openEdit,
} = useBookmarks()

const {
  collectionDialogOpen,
  categoryDialogOpen,
  editingCollection,
  editingCategory,
  openNewCollection,
  openNewCategory,
} = useBookmarkCollections()

const mobileSidebarOpen = ref(false)
const searchInput = ref('')

const activeCollection = computed(() => collectionStore.activeCollection)
const activeCategories = computed(() => collectionStore.activeCategories)
const activeCategoryId = computed(() => collectionStore.activeCategoryId)

const allBookmarksForCollection = computed(() => {
  if (!activeCategoryId.value) return bookmarkStore.bookmarks
  return bookmarkStore.bookmarks
})

function handleCategorySelect(categoryId: string | null) {
  collectionStore.setActiveCategory(categoryId)
}

function handleSearch(e: Event) {
  const term = (e.target as HTMLInputElement).value
  searchInput.value = term
  onSearch(term)
}

onMounted(async () => {
  await collectionStore.fetchCollections()
  if (collectionStore.activeCategoryId) {
    await bookmarkStore.fetchBookmarks(collectionStore.activeCategoryId)
  }
})
</script>

<template>
  <div class="flex h-full overflow-hidden">

    <!-- ── Sidebar (desktop) ─────────────────────────────────────────── -->
    <aside class="hidden md:flex w-56 shrink-0 border-r border-border flex-col overflow-hidden">
      <div class="px-5 pt-5 pb-3 border-b border-border/40 shrink-0">
        <p class="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/40 mb-1 select-none">
          PESSOAL
        </p>
        <h1 class="text-[17px] font-semibold text-foreground tracking-tight">Bookmarks</h1>
      </div>
      <BookmarkCollectionSidebar
        class="flex-1 overflow-y-auto"
        @new-collection="openNewCollection"
        @new-category="openNewCategory"
      />
    </aside>

    <!-- ── Main content ──────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Content header -->
      <div class="px-5 py-4 border-b border-border/30 shrink-0">
        <!-- Mobile: hamburger + title row -->
        <div class="flex items-center gap-3 mb-3 md:mb-0">
          <button
            type="button"
            class="md:hidden size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors"
            @click="mobileSidebarOpen = true"
          >
            <Menu :size="18" />
          </button>

          <div class="flex-1 min-w-0">
            <h2 class="text-[16px] font-bold text-foreground truncate">
              {{ activeCollection?.name ?? 'Bookmarks' }}
            </h2>
            <p class="text-[12px] text-muted-foreground/60 hidden md:block">
              {{ activeCollection?.bookmarks_count ?? 0 }} bookmarks
            </p>
          </div>

          <!-- Add bookmark button -->
          <button
            v-if="activeCollection"
            type="button"
            class="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
            @click="addDialogOpen = true"
          >
            <Plus :size="14" />
            <span class="hidden sm:inline">Adicionar</span>
          </button>
        </div>

        <!-- Search + favorites row (only when collection selected) -->
        <div v-if="activeCollection" class="flex items-center gap-2 mt-3">
          <!-- Search input -->
          <div class="flex-1 relative">
            <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
            <input
              :value="searchInput"
              type="search"
              placeholder="Buscar bookmarks..."
              class="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/40 border border-border text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
              @input="handleSearch"
            />
          </div>

          <!-- Favorites toggle -->
          <button
            type="button"
            class="size-9 rounded-xl flex items-center justify-center transition-colors border"
            :class="bookmarkStore.showFavoritesOnly
              ? 'bg-warning/15 text-warning border-warning/30'
              : 'bg-muted/40 text-muted-foreground/40 border-border hover:text-muted-foreground'"
            @click="toggleFavoritesFilter"
          >
            <Star :size="14" :class="bookmarkStore.showFavoritesOnly ? 'fill-warning' : ''" />
          </button>
        </div>
      </div>

      <!-- Category tabs -->
      <BookmarkCategoryTabs
        v-if="activeCollection && activeCategories.length > 0"
        :categories="activeCategories"
        :active-category-id="activeCategoryId"
        @select="handleCategorySelect"
        @new-category="openNewCategory"
      />

      <!-- Bookmark list -->
      <div class="flex-1 overflow-y-auto px-4 py-2">

        <!-- Empty: no collections -->
        <div
          v-if="collectionStore.collections.length === 0 && !collectionStore.loading"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <span class="size-12 rounded-xl bg-muted/30 grid place-items-center mb-3">
            <FolderOpen :size="22" class="text-muted-foreground/30" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground">Crie sua primeira coleção</p>
          <p class="text-[12px] text-muted-foreground/50 mt-1 mb-4">Organize seus links em pastas</p>
          <button
            type="button"
            class="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
            @click="openNewCollection"
          >
            <Plus :size="14" />
            Nova coleção
          </button>
        </div>

        <!-- Loading -->
        <div v-else-if="bookmarkStore.isLoading" class="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 :size="18" class="animate-spin mr-2" />
          <span class="text-[13px]">Carregando...</span>
        </div>

        <!-- Empty: no bookmarks in category -->
        <div
          v-else-if="!bookmarkStore.isLoading && activeCategoryId && allBookmarksForCollection.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <span class="size-12 rounded-xl bg-muted/30 grid place-items-center mb-3">
            <Bookmark :size="22" class="text-muted-foreground/30" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground">Nenhum bookmark ainda</p>
          <p class="text-[12px] text-muted-foreground/50 mt-1">Adicione o primeiro usando o botão acima</p>
        </div>

        <!-- No category selected -->
        <div
          v-else-if="activeCollection && !activeCategoryId"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <span class="size-12 rounded-xl bg-muted/30 grid place-items-center mb-3">
            <Bookmark :size="22" class="text-muted-foreground/30" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground">Selecione uma categoria</p>
          <p class="text-[12px] text-muted-foreground/50 mt-1">Clique em uma categoria acima para ver os bookmarks</p>
        </div>

        <!-- Bookmark list -->
        <div v-else class="divide-y divide-border/20">
          <BookmarkListItem
            v-for="bookmark in allBookmarksForCollection"
            :key="bookmark.id"
            :bookmark="bookmark"
            @edit="openEdit"
          />
        </div>
      </div>
    </div>

    <!-- ── Mobile sidebar drawer ─────────────────────────────────────── -->
    <Sheet v-model:open="mobileSidebarOpen">
      <SheetContent side="left" class="p-0 w-72 bg-background border-r border-border [&>button]:hidden">
        <div class="px-5 pt-5 pb-3 border-b border-border/40">
          <h2 class="text-[16px] font-semibold text-foreground">Bookmarks</h2>
        </div>
        <BookmarkCollectionSidebar
          @new-collection="() => { mobileSidebarOpen = false; openNewCollection() }"
          @new-category="() => { mobileSidebarOpen = false; openNewCategory() }"
        />
      </SheetContent>
    </Sheet>

    <!-- ── Dialogs ────────────────────────────────────────────────────── -->
    <BookmarkAddDialog
      v-model:open="addDialogOpen"
      :default-category-id="activeCategoryId"
    />

    <BookmarkEditDialog
      v-if="editingBookmark"
      v-model:open="editDialogOpen"
      :bookmark="editingBookmark"
    />

    <CollectionFormDialog
      v-model:open="collectionDialogOpen"
      :collection="editingCollection"
    />

    <CategoryFormDialog
      v-if="collectionStore.activeCollectionId"
      v-model:open="categoryDialogOpen"
      :collection-id="collectionStore.activeCollectionId"
      :category="editingCategory"
    />
  </div>
</template>
