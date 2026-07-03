<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, Loader2, CheckCircle, TrendingDown, TrendingUp } from 'lucide-vue-next'
import CategoryColorPicker from './CategoryColorPicker.vue'
import CategoryIconPicker from './CategoryIconPicker.vue'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import type { TransactionCategory, TransactionType } from '@/types/finance'
import { CATEGORY_PRESET_COLORS } from '../utils/categoryColors'

const props = defineProps<{
  open: boolean
  /** Pre-select the type to match the current transaction form type */
  defaultType?: TransactionType
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [category: TransactionCategory]
}>()

const store = useFinanceStore()
const toast = useToast()

const name = ref('')
const type = ref<'expense' | 'income'>('expense')
const color = ref(CATEGORY_PRESET_COLORS[0]!)
const icon = ref('')
const saving = ref(false)

// Reset form every time the sheet opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = ''
      icon.value = ''
      color.value = CATEGORY_PRESET_COLORS[0]!
      type.value = (props.defaultType === 'income' ? 'income' : 'expense')
    }
  },
)

function close() {
  emit('update:open', false)
}

async function create() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    const created = await store.createCategory({
      name: name.value.trim(),
      type: type.value,
      color: color.value,
      icon: icon.value || null,
      monthly_limit: null,
      is_default: false,
    })
    emit('created', created)
    toast.success('Categoria criada')
    close()
  } catch {
    toast.error('Erro ao criar categoria')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[90vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-border shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          @click="close"
        >
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h3 class="text-[15px] font-semibold leading-none">Nova categoria</h3>
          <p class="text-[11px] text-muted-foreground mt-0.5">Disponível nos formulários de transação</p>
        </div>
      </div>

      <!-- Scrollable form -->
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        <!-- Name -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Nome <span class="text-destructive">*</span>
          </p>
          <input
            v-model="name"
            placeholder="Ex: Alimentação, Salário..."
            class="w-full h-11 px-4 rounded-lg bg-card focus:border-primary outline-none text-sm transition-colors"
            @keydown.enter="create"
          />
        </div>

        <!-- Type pills -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Tipo
          </p>
          <div class="grid grid-cols-2 gap-1 p-1 bg-card rounded-xl">
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 h-11 rounded-lg text-[12px] font-semibold transition-all"
              :class="type === 'expense'
                ? 'bg-muted text-destructive '
                : 'text-muted-foreground'"
              @click="type = 'expense'"
            >
              <TrendingDown :size="13" />
              Despesa
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 h-11 rounded-lg text-[12px] font-semibold transition-all"
              :class="type === 'income'
                ? 'bg-muted text-success '
                : 'text-muted-foreground'"
              @click="type = 'income'"
            >
              <TrendingUp :size="13" />
              Receita
            </button>
          </div>
        </div>

        <!-- Color -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Cor
          </p>
          <CategoryColorPicker v-model="color" />
        </div>

        <!-- Icon -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Ícone
          </p>
          <CategoryIconPicker v-model="icon" :color="color" />
        </div>

      </div>

      <!-- Footer CTA -->
      <div class="px-4 pt-2 pb-5 shrink-0">
        <button
          type="button"
          class="w-full h-[52px] rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-background"
          :class="[
            type === 'expense' ? 'bg-destructive' : 'bg-success',
            (!name.trim() || saving) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90',
          ]"
          :disabled="saving || !name.trim()"
          @click="create"
        >
          <Loader2 v-if="saving" :size="18" class="animate-spin" />
          <template v-else>
            <CheckCircle :size="18" :stroke-width="2.5" />
            Criar categoria
          </template>
        </button>
      </div>

    </SheetContent>
  </Sheet>
</template>
