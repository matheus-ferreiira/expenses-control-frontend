<script setup lang="ts">
import { ref } from 'vue'
import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@ui/alert-dialog'
import { findIcon } from '@/lib/icons'
import type { BookmarkCollection } from '@/types/bookmarks'

const props = defineProps<{
  collection: BookmarkCollection
}>()

const emit = defineEmits<{
  click: [collection: BookmarkCollection]
  edit: [collection: BookmarkCollection]
  delete: [collection: BookmarkCollection]
}>()

const deleteOpen = ref(false)
const iconComponent = findIcon(props.collection.icon ?? '')?.component ?? null
</script>

<template>
  <div
    class="group relative bg-card border border-border/60 rounded-2xl cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-all duration-200 active:scale-[0.98]"
    :style="collection.color ? { borderTopColor: collection.color, borderTopWidth: '2px' } : {}"
    :class="!collection.color ? 'border-t-2 border-t-primary/40' : ''"
    @click="emit('click', collection)"
  >
    <div class="p-4">
      <!-- Icon -->
      <div
        class="size-11 rounded-xl grid place-items-center mb-3"
        :style="collection.color
          ? { background: collection.color + '22', color: collection.color }
          : {}"
        :class="!collection.color ? 'bg-primary/15 text-primary' : ''"
      >
        <component
          v-if="iconComponent"
          :is="iconComponent"
          :size="20"
        />
        <Folder v-else :size="20" />
      </div>

      <!-- Name -->
      <p class="text-[14px] font-semibold text-foreground truncate leading-snug">
        {{ collection.name }}
      </p>

      <!-- Count -->
      <p class="text-[12px] text-muted-foreground/60 mt-0.5">
        {{ collection.bookmarks_count }}
        {{ collection.bookmarks_count === 1 ? 'link' : 'links' }}
      </p>
    </div>

    <!-- Menu ⋮ — stop click to prevent opening the collection -->
    <div class="absolute top-2 right-2" @click.stop>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="size-7 rounded-lg grid place-items-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-all duration-150 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal :size="14" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-[152px]">
          <DropdownMenuItem
            class="text-[12px] cursor-pointer"
            @click="emit('edit', collection)"
          >
            <Pencil class="size-3.5" />
            Editar coleção
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-[12px] cursor-pointer text-destructive focus:text-destructive"
            @click="deleteOpen = true"
          >
            <Trash2 class="size-3.5" />
            Excluir coleção
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  <!-- Delete confirmation -->
  <AlertDialog v-model:open="deleteOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir coleção?</AlertDialogTitle>
        <AlertDialogDescription>
          A coleção "<span class="font-medium text-foreground">{{ collection.name }}</span>" e todos os seus
          {{ collection.bookmarks_count === 1 ? '1 link será excluído' : `${collection.bookmarks_count} links serão excluídos` }}
          permanentemente. Essa ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="emit('delete', collection)"
        >
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
