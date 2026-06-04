<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Globe, Star, ExternalLink, Copy, Pencil, Trash2, MoreHorizontal } from 'lucide-vue-next'
import { useBookmarkStore } from '@/stores/bookmarks'
import { useToast } from '@/composables/useToast'
import type { Bookmark } from '@/types/bookmarks'

const props = defineProps<{
  bookmark: Bookmark
}>()

const emit = defineEmits<{
  edit: [bookmark: Bookmark]
}>()

const store = useBookmarkStore()
const toast = useToast()
const menuOpen = ref(false)
const imgError = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => { menuOpen.value = false })

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function openLink() {
  window.open(props.bookmark.url, '_blank', 'noopener,noreferrer')
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(props.bookmark.url)
    toast.success('URL copiada')
  } catch {
    toast.error('Erro ao copiar')
  }
  menuOpen.value = false
}

async function handleToggleFavorite() {
  try {
    await store.toggleFavorite(props.bookmark.id)
  } catch {
    toast.error('Erro ao atualizar favorito')
  }
}

async function handleDelete() {
  try {
    await store.deleteBookmark(props.bookmark.id)
    toast.success('Bookmark removido')
  } catch {
    toast.error('Erro ao remover')
  }
  menuOpen.value = false
}
</script>

<template>
  <div
    class="group flex items-start gap-3 py-3.5 border-b border-border/30 last:border-0 transition-colors hover:bg-muted/10 rounded-lg px-2"
    :class="bookmark.is_favorite ? 'border-l-2 border-primary/60 pl-3' : ''"
  >
    <!-- Favicon -->
    <div class="size-5 rounded shrink-0 mt-0.5 overflow-hidden">
      <img
        v-if="bookmark.favicon_url && !imgError"
        :src="bookmark.favicon_url"
        :alt="bookmark.title"
        class="size-full object-contain"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imgError = true"
      />
      <Globe v-else :size="16" class="text-muted-foreground/40 mt-0.5" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <button
        type="button"
        class="text-[13px] font-medium text-foreground hover:text-primary transition-colors text-left leading-snug truncate w-full"
        @click="openLink"
      >
        {{ bookmark.title }}
      </button>
      <p class="text-[11px] text-muted-foreground/60 font-mono truncate mt-0.5">
        {{ getDomain(bookmark.url) }}
      </p>
      <p
        v-if="bookmark.description"
        class="text-[12px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed"
      >
        {{ bookmark.description }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-0.5 shrink-0">
      <!-- Favorite star -->
      <button
        type="button"
        class="size-7 grid place-items-center rounded transition-all duration-150"
        :class="bookmark.is_favorite
          ? 'text-warning opacity-100'
          : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-warning'"
        @click="handleToggleFavorite"
      >
        <Star :size="14" :class="bookmark.is_favorite ? 'fill-warning' : ''" />
      </button>

      <!-- Open link -->
      <button
        type="button"
        class="size-7 grid place-items-center rounded text-muted-foreground/30 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
        @click="openLink"
      >
        <ExternalLink :size="13" />
      </button>

      <!-- More menu -->
      <div ref="menuRef" class="relative">
        <button
          type="button"
          class="size-7 grid place-items-center rounded text-muted-foreground/30 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
          @click="menuOpen = !menuOpen"
        >
          <MoreHorizontal :size="14" />
        </button>

        <div
          v-if="menuOpen"
          class="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-md py-1 min-w-[140px]"
        >
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors"
            @click="copyUrl"
          >
            <Copy :size="12" />
            Copiar URL
          </button>
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors"
            @click="emit('edit', bookmark); menuOpen = false"
          >
            <Pencil :size="12" />
            Editar
          </button>
          <div class="h-px bg-border/30 mx-2 my-1" />
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-destructive hover:bg-destructive/5 transition-colors"
            @click="handleDelete"
          >
            <Trash2 :size="12" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
