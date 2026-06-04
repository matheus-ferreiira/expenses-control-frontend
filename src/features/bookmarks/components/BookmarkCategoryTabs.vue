<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { BookmarkCategory } from '@/types/bookmarks'

defineProps<{
  categories: BookmarkCategory[]
  activeCategoryId: string | null
}>()

const emit = defineEmits<{
  select: [categoryId: string | null]
  newCategory: []
}>()
</script>

<template>
  <div class="flex items-center gap-1.5 overflow-x-auto px-5 py-2.5 scrollbar-none border-b border-border/30 shrink-0">
    <!-- Todas pill -->
    <button
      type="button"
      class="shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-colors duration-150 whitespace-nowrap"
      :class="activeCategoryId === null
        ? 'bg-primary/15 text-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'"
      @click="emit('select', null)"
    >
      Todas
    </button>

    <!-- Category pills -->
    <button
      v-for="cat in categories"
      :key="cat.id"
      type="button"
      class="shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-colors duration-150 whitespace-nowrap"
      :class="activeCategoryId === cat.id
        ? 'bg-primary/15 text-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'"
      @click="emit('select', cat.id)"
    >
      {{ cat.name }}
      <span class="ml-1 opacity-50">{{ cat.bookmarks_count }}</span>
    </button>

    <!-- Add category button -->
    <button
      type="button"
      class="shrink-0 size-6 rounded-full grid place-items-center text-muted-foreground/40 hover:text-primary hover:bg-muted/40 transition-colors duration-150 ml-1"
      @click="emit('newCategory')"
    >
      <Plus :size="12" />
    </button>
  </div>
</template>
