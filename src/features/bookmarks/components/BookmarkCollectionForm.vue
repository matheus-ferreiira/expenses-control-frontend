<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { findIcon } from '@/lib/icons'
import { useBookmarkCollectionStore } from '@/stores/bookmarkCollections'
import { useToast } from '@/composables/useToast'
import type { BookmarkCollection } from '@/types/bookmarks'

const COLLECTION_ICONS = [
  'Code', 'Briefcase', 'Home', 'ShoppingBag', 'Heart', 'Star',
  'Music', 'Book', 'Camera', 'Plane', 'Car', 'Gamepad2',
]

const PRESET_COLORS = [
  '#00C896', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
]

const props = defineProps<{
  collection?: BookmarkCollection | null
}>()

const open = defineModel<boolean>('open', { default: false })

const store = useBookmarkCollectionStore()
const toast = useToast()

const name = ref('')
const selectedIcon = ref<string | null>(null)
const selectedColor = ref<string | null>('#00C896')
const submitting = ref(false)

watch(open, (val) => {
  if (val) {
    name.value = props.collection?.name ?? ''
    selectedIcon.value = props.collection?.icon ?? null
    selectedColor.value = props.collection?.color ?? '#00C896'
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

      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <!-- Nome -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            NOME <span class="text-destructive ml-0.5">*</span>
          </p>
          <input
            v-model="name"
            autofocus
            type="text"
            placeholder="Ex: Dev, Carro, Casa..."
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
            @keydown.enter="submit"
          />
        </div>

        <!-- Ícone -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            ÍCONE (opcional)
          </p>
          <div class="grid grid-cols-6 gap-2">
            <!-- Sem ícone -->
            <button
              type="button"
              class="h-10 rounded-xl text-[11px] font-medium transition-all"
              :class="selectedIcon === null
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
              @click="selectedIcon = null"
            >
              —
            </button>
            <button
              v-for="iconName in COLLECTION_ICONS"
              :key="iconName"
              type="button"
              class="h-10 rounded-xl flex items-center justify-center transition-all"
              :class="selectedIcon === iconName
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'"
              @click="selectedIcon = iconName"
            >
              <component
                v-if="findIcon(iconName)"
                :is="findIcon(iconName)!.component"
                :size="16"
                :style="selectedColor && selectedIcon === iconName ? { color: selectedColor } : {}"
              />
            </button>
          </div>
        </div>

        <!-- Cor -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            COR
          </p>
          <div class="flex gap-3 flex-wrap">
            <button
              v-for="color in PRESET_COLORS"
              :key="color"
              type="button"
              class="size-7 rounded-full transition-all hover:scale-110"
              :class="selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : ''"
              :style="{ background: color, '--tw-ring-color': color }"
              @click="selectedColor = color"
            />
          </div>
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
