<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { ICON_PALETTE_COLORS, ICON_CATEGORIES } from '@/lib/icons'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import { useToast } from '@/composables/useToast'
import type { BookmarkCollection } from '@/types/bookmarks'

const props = defineProps<{
  collection?: BookmarkCollection | null
}>()

const open = defineModel<boolean>('open', { default: false })

const store = useBookmarkCollectionStore()
const toast = useToast()

const name = ref('')
const selectedIcon = ref<string | null>(null)
const selectedColor = ref<string | null>(null)
const submitting = ref(false)

const BOOKMARK_ICONS = [
  ...ICON_CATEGORIES.find((c) => c.id === 'work')?.icons ?? [],
  ...ICON_CATEGORIES.find((c) => c.id === 'tech')?.icons ?? [],
  ...ICON_CATEGORIES.find((c) => c.id === 'personal')?.icons ?? [],
  ...ICON_CATEGORIES.find((c) => c.id === 'education')?.icons ?? [],
].slice(0, 16)

watch(open, (val) => {
  if (val) {
    name.value = props.collection?.name ?? ''
    selectedIcon.value = props.collection?.icon ?? null
    selectedColor.value = props.collection?.color ?? null
  }
})

async function submit() {
  if (!name.value.trim()) return
  submitting.value = true
  try {
    const payload = {
      name: name.value.trim(),
      icon: selectedIcon.value,
      color: selectedColor.value,
    }
    if (props.collection) {
      await store.updateCollection(props.collection.id, payload)
      toast.success('Coleção atualizada')
    } else {
      await store.createCollection(payload)
      toast.success('Coleção criada')
    }
    open.value = false
  } catch {
    toast.error('Erro ao salvar coleção')
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

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border/50 shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
          @click="open = false"
        >
          <ArrowLeft :size="18" />
        </button>
        <h3 class="text-[15px] font-semibold leading-none">
          {{ collection ? 'Editar coleção' : 'Nova coleção' }}
        </h3>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <!-- Name -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            NOME <span class="text-destructive ml-0.5">*</span>
          </p>
          <input
            v-model="name"
            autofocus
            placeholder="Ex: Trabalho, Estudos, Dev..."
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
            @keydown.enter="submit"
          />
        </div>

        <!-- Icon selector -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            ÍCONE (opcional)
          </p>
          <div class="grid grid-cols-8 gap-1.5">
            <!-- No icon option -->
            <button
              type="button"
              class="size-9 rounded-lg flex items-center justify-center transition-all border text-[10px] text-muted-foreground/40"
              :class="selectedIcon === null ? 'border-primary bg-primary/10' : 'border-border/40 bg-muted/20 hover:bg-muted/40'"
              @click="selectedIcon = null"
            >
              —
            </button>
            <button
              v-for="entry in BOOKMARK_ICONS"
              :key="entry.name"
              type="button"
              class="size-9 rounded-lg flex items-center justify-center transition-all border"
              :class="selectedIcon === entry.name ? 'border-primary bg-primary/10' : 'border-border/40 bg-muted/20 hover:bg-muted/40'"
              :title="entry.label"
              @click="selectedIcon = entry.name"
            >
              <component
                :is="entry.component"
                :size="16"
                :style="selectedColor ? { color: selectedColor } : {}"
                class="text-muted-foreground"
              />
            </button>
          </div>
        </div>

        <!-- Color picker -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            COR (opcional)
          </p>
          <div class="flex gap-2 flex-wrap">
            <button
              type="button"
              class="size-7 rounded-full transition-all border-2 border-transparent hover:scale-110"
              :class="selectedColor === null ? 'ring-2 ring-muted-foreground ring-offset-2 ring-offset-background' : ''"
              style="background: hsl(var(--muted))"
              @click="selectedColor = null"
            />
            <button
              v-for="color in ICON_PALETTE_COLORS"
              :key="color"
              type="button"
              class="size-7 rounded-full transition-all hover:scale-110"
              :class="selectedColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''"
              :style="{ background: color }"
              @click="selectedColor = color"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
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
          {{ collection ? 'Salvar' : 'Criar coleção' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
