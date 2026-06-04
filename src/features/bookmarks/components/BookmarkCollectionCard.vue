<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
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

const menuOpen = ref(false)
const deleteOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => { menuOpen.value = false })

const iconComponent = findIcon(props.collection.icon ?? '')?.component ?? null

function handleMenuEdit(e: Event) {
  e.stopPropagation()
  menuOpen.value = false
  emit('edit', props.collection)
}

function handleMenuDelete(e: Event) {
  e.stopPropagation()
  menuOpen.value = false
  deleteOpen.value = true
}

function toggleMenu(e: Event) {
  e.stopPropagation()
  menuOpen.value = !menuOpen.value
}

function handleDeleteDialogClick(e: Event) {
  e.stopPropagation()
}
</script>

<template>
  <div
    class="group relative bg-card border border-border/60 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-all duration-200 active:scale-[0.98]"
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

    <!-- Menu ⋮ -->
    <div
      ref="menuRef"
      class="absolute top-2.5 right-2.5"
    >
      <button
        type="button"
        class="size-7 rounded-lg grid place-items-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-all duration-150 opacity-0 group-hover:opacity-100"
        @click="toggleMenu"
      >
        <MoreHorizontal :size="14" />
      </button>

      <div
        v-if="menuOpen"
        class="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-md py-1 min-w-[150px]"
      >
        <button
          class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors"
          @click="handleMenuEdit"
        >
          <Pencil :size="12" />
          Editar coleção
        </button>
        <div class="h-px bg-border/30 mx-2 my-1" />
        <button
          class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-destructive hover:bg-destructive/5 transition-colors"
          @click="handleMenuDelete"
        >
          <Trash2 :size="12" />
          Excluir coleção
        </button>
      </div>
    </div>
  </div>

  <!-- Delete confirmation -->
  <AlertDialog v-model:open="deleteOpen">
    <AlertDialogContent @click="handleDeleteDialogClick">
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir coleção?</AlertDialogTitle>
        <AlertDialogDescription>
          A coleção "<span class="font-medium text-foreground">{{ collection.name }}</span>" e todos os seus links serão excluídos permanentemente. Essa ação não pode ser desfeita.
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
