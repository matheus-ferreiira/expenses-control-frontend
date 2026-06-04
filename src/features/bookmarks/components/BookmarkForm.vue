<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { useBookmarkStore } from '@/stores/bookmarks'
import { useToast } from '@/composables/useToast'
import type { Bookmark } from '@/types/bookmarks'

const props = defineProps<{
  collectionId: string
  bookmark?: Bookmark | null
}>()

const open = defineModel<boolean>('open', { default: false })

const bookmarkStore = useBookmarkStore()
const toast = useToast()

const url = ref('')
const title = ref('')
const description = ref('')
const isFavorite = ref(false)
const submitting = ref(false)

const isValid = computed(() => url.value.trim().length > 0 && title.value.trim().length > 0)
const isEditing = computed(() => !!props.bookmark)

watch(open, (val) => {
  if (val) {
    url.value = props.bookmark?.url ?? ''
    title.value = props.bookmark?.title ?? ''
    description.value = props.bookmark?.description ?? ''
    isFavorite.value = props.bookmark?.is_favorite ?? false
  }
})

async function submit() {
  if (!isValid.value) return
  submitting.value = true
  try {
    if (props.bookmark) {
      await bookmarkStore.updateBookmark(props.bookmark.id, {
        url: url.value.trim(),
        title: title.value.trim(),
        description: description.value.trim() || null,
        is_favorite: isFavorite.value,
      })
      toast.success('Link atualizado')
    } else {
      await bookmarkStore.createBookmark(props.collectionId, {
        url: url.value.trim(),
        title: title.value.trim(),
        description: description.value.trim() || null,
        is_favorite: isFavorite.value,
      })
      toast.success('Link salvo')
    }
    open.value = false
  } catch {
    toast.error(isEditing.value ? 'Erro ao atualizar link' : 'Erro ao salvar link')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border/50 shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
          @click="open = false"
        >
          <ArrowLeft :size="18" />
        </button>
        <h3 class="text-[15px] font-semibold leading-none">
          {{ isEditing ? 'Editar link' : 'Salvar link' }}
        </h3>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <!-- URL -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            URL <span class="text-destructive ml-0.5">*</span>
          </p>
          <input
            v-model="url"
            autofocus
            type="url"
            placeholder="https://..."
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] font-mono text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40 placeholder:font-sans"
          />
        </div>

        <!-- Título -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            TÍTULO <span class="text-destructive ml-0.5">*</span>
          </p>
          <input
            v-model="title"
            type="text"
            placeholder="Nome do link"
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
            @keydown.enter="submit"
          />
        </div>

        <!-- Descrição -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            DESCRIÇÃO (opcional)
          </p>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Descrição opcional..."
            class="w-full rounded-lg border border-border/60 bg-card px-3 py-2.5 text-[13px] text-foreground resize-none outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          />
        </div>

        <!-- Favorito -->
        <div class="flex items-center justify-between py-1">
          <p class="text-[13px] font-medium text-foreground">Marcar como favorito</p>
          <button
            type="button"
            class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
            :class="isFavorite ? 'bg-primary' : 'bg-muted'"
            @click="isFavorite = !isFavorite"
          >
            <span
              class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
              :class="isFavorite ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <div class="px-4 pt-3 pb-8 border-t border-border/40 shrink-0 flex gap-2">
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl text-[15px] transition-colors bg-muted/60 border border-border/50 text-muted-foreground"
          :disabled="submitting"
          @click="open = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!isValid || submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ isEditing ? 'Salvar' : 'Salvar link' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
