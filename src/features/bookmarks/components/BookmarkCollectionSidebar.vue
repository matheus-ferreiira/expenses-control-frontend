<script setup lang="ts">
import { Folder, FolderPlus, Plus } from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'

defineEmits<{
  newCollection: []
  newCategory: []
}>()

const store = useBookmarkCollectionStore()
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Collections list -->
    <div class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
      <template v-for="collection in store.collections" :key="collection.id">
        <!-- Collection row -->
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-150"
          :class="store.activeCollectionId === collection.id
            ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[9px]'
            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'"
          @click="store.setActiveCollection(collection.id)"
        >
          <!-- Icon -->
          <span class="size-5 shrink-0 flex items-center justify-center">
            <component
              v-if="collection.icon && findIcon(collection.icon)"
              :is="findIcon(collection.icon)!.component"
              :size="15"
              :style="collection.color ? { color: collection.color } : {}"
            />
            <Folder v-else :size="15" />
          </span>

          <span class="flex-1 text-[13px] truncate font-medium">{{ collection.name }}</span>

          <span class="text-[10px] tabular-nums shrink-0 opacity-60">
            {{ collection.bookmarks_count }}
          </span>
        </button>

        <!-- Categories (expanded when this collection is active) -->
        <template v-if="store.activeCollectionId === collection.id && collection.categories?.length">
          <button
            v-for="category in collection.categories"
            :key="category.id"
            type="button"
            class="w-full flex items-center gap-2 pl-8 pr-2.5 py-1.5 rounded-lg text-left transition-colors duration-150"
            :class="store.activeCategoryId === category.id
              ? 'text-primary font-medium'
              : 'text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground'"
            @click="store.setActiveCategory(store.activeCategoryId === category.id ? null : category.id)"
          >
            <span class="flex-1 text-[12px] truncate">{{ category.name }}</span>
            <span class="text-[10px] tabular-nums shrink-0 opacity-50">{{ category.bookmarks_count }}</span>
          </button>

          <!-- Add category -->
          <button
            type="button"
            class="w-full flex items-center gap-2 pl-8 pr-2.5 py-1.5 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-muted/30 transition-colors duration-150 text-[12px]"
            @click="$emit('newCategory')"
          >
            <Plus :size="12" />
            <span>Nova categoria</span>
          </button>
        </template>
      </template>
    </div>

    <!-- Footer: new collection -->
    <div class="px-2 py-3 border-t border-border/40 shrink-0">
      <button
        type="button"
        class="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground transition-colors duration-150"
        @click="$emit('newCollection')"
      >
        <FolderPlus :size="14" class="shrink-0" />
        <span class="text-[12px]">Nova coleção</span>
      </button>
    </div>
  </div>
</template>
