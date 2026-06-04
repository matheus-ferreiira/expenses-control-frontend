<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import { useToast } from '@/composables/useToast'
import type { BookmarkCategory } from '@/types/bookmarks'

const props = defineProps<{
  collectionId: string
  category?: BookmarkCategory | null
}>()

const open = defineModel<boolean>('open', { default: false })

const store = useBookmarkCollectionStore()
const toast = useToast()
const name = ref('')
const submitting = ref(false)

watch(open, (val) => {
  if (val) name.value = props.category?.name ?? ''
})

async function submit() {
  if (!name.value.trim()) return
  submitting.value = true
  try {
    if (props.category) {
      await store.updateCategory(props.category.id, { name: name.value.trim() })
      toast.success('Categoria atualizada')
    } else {
      await store.createCategory(props.collectionId, { name: name.value.trim() })
      toast.success('Categoria criada')
    }
    open.value = false
  } catch {
    toast.error('Erro ao salvar categoria')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[50vh] flex flex-col [&>button]:hidden"
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
          {{ category ? 'Editar categoria' : 'Nova categoria' }}
        </h3>
      </div>

      <div class="flex-1 px-4 py-5">
        <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
          NOME <span class="text-destructive ml-0.5">*</span>
        </p>
        <input
          v-model="name"
          autofocus
          placeholder="Ex: Frontend, Backend, Ferramentas..."
          class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          @keydown.enter="submit"
        />
      </div>

      <div class="px-4 pt-3 pb-8 border-t border-border/40 shrink-0 flex gap-2">
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl text-[15px] transition-colors bg-muted/60 border border-border/50 text-muted-foreground"
          @click="open = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-primary text-primary-foreground disabled:opacity-40"
          :disabled="!name.trim() || submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ category ? 'Salvar' : 'Criar' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
