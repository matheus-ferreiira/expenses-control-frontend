<script setup lang="ts">
import { ref } from 'vue'
import { Star, ExternalLink, Copy, Pencil, Trash2, MoreHorizontal } from 'lucide-vue-next'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@ui/alert-dialog'
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
const deleteOpen = ref(false)
const imgError = ref(false)

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function getDomainInitial(url: string): string {
  return getDomain(url).charAt(0).toUpperCase()
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
    toast.success('Link removido')
  } catch {
    toast.error('Erro ao remover link')
  }
}
</script>

<template>
  <div
    class="group flex items-start gap-3 py-3.5 border-b border-border/30 last:border-0 transition-colors hover:bg-muted/10 rounded-lg px-2"
    :class="bookmark.is_favorite ? 'border-l-2 border-warning/60 pl-3 -ml-px' : ''"
  >
    <!-- Favicon -->
    <div class="size-5 rounded-sm shrink-0 mt-0.5 overflow-hidden">
      <img
        v-if="bookmark.favicon_url && !imgError"
        :src="bookmark.favicon_url"
        :alt="bookmark.title"
        class="size-full object-contain"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imgError = true"
      />
      <div
        v-else
        class="size-full bg-muted rounded-sm flex items-center justify-center text-[9px] font-bold text-muted-foreground leading-none"
      >
        {{ getDomainInitial(bookmark.url) }}
      </div>
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
      <p class="text-[11px] text-muted-foreground/60 truncate mt-0.5">
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

      <!-- More menu — DropdownMenu teleports outside overflow containers -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="size-7 grid place-items-center rounded text-muted-foreground/30 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
          >
            <MoreHorizontal :size="14" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-[148px]">
          <DropdownMenuItem class="text-[12px] cursor-pointer" @click="copyUrl">
            <Copy class="size-3.5" />
            Copiar URL
          </DropdownMenuItem>
          <DropdownMenuItem class="text-[12px] cursor-pointer" @click="emit('edit', bookmark)">
            <Pencil class="size-3.5" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-[12px] cursor-pointer text-destructive focus:text-destructive"
            @click="deleteOpen = true"
          >
            <Trash2 class="size-3.5" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  <!-- Delete confirmation -->
  <AlertDialog v-model:open="deleteOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir link?</AlertDialogTitle>
        <AlertDialogDescription>
          O link "<span class="font-medium text-foreground">{{ bookmark.title }}</span>" será removido permanentemente.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="handleDelete"
        >
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
