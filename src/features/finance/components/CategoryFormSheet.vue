<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, Loader2, CheckCircle, X } from 'lucide-vue-next'
import CategoryColorPicker from './CategoryColorPicker.vue'
import CategoryIconPicker from './CategoryIconPicker.vue'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import type { TransactionCategory } from '@/types/finance'

const props = defineProps<{
  open: boolean
  category?: TransactionCategory | null
  defaultType?: 'expense' | 'income'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [category: TransactionCategory]
}>()

const store = useFinanceStore()
const toast = useToast()
const saving = ref(false)

const name = ref('')
const type = ref<'expense' | 'income'>('expense')
const color = ref('#8b5cf6')
const icon = ref('')
const monthlyLimit = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    if (props.category) {
      name.value = props.category.name
      type.value = props.category.type as 'expense' | 'income'
      color.value = props.category.color ?? '#8b5cf6'
      icon.value = props.category.icon ?? ''
      monthlyLimit.value = props.category.monthly_limit != null
        ? String(props.category.monthly_limit)
        : ''
    } else {
      name.value = ''
      type.value = props.defaultType ?? 'expense'
      color.value = '#8b5cf6'
      icon.value = ''
      monthlyLimit.value = ''
    }
  },
)

function close() {
  emit('update:open', false)
}

async function save() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    const raw = monthlyLimit.value.replace(',', '.').trim()
    const monthly_limit: number | null = raw === '' ? null : parseFloat(raw)
    const payload = {
      name: name.value.trim(),
      type: type.value,
      color: color.value,
      icon: icon.value || null,
      monthly_limit: isNaN(monthly_limit as number) ? null : monthly_limit,
      is_default: false,
    }
    let saved: TransactionCategory
    if (props.category) {
      saved = await store.updateCategory(props.category.id, payload)
      toast.success('Categoria atualizada')
    } else {
      saved = await store.createCategory(payload)
      toast.success('Categoria criada')
    }
    emit('saved', saved)
    close()
  } catch {
    toast.error('Erro ao salvar categoria')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border/50 shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
          @click="close"
        >
          <ArrowLeft :size="18" />
        </button>
        <h3 class="text-[15px] font-semibold leading-none">
          {{ category ? 'Editar categoria' : 'Nova categoria' }}
        </h3>
      </div>

      <!-- Scrollable form -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Nome -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Nome <span class="text-destructive">*</span>
          </p>
          <input
            v-model="name"
            placeholder="Ex: Alimentação, Salário..."
            class="w-full h-12 px-4 rounded-lg bg-card border border-border/60 focus:border-primary outline-none text-[13px] transition-colors"
            @keydown.enter="save"
          />
        </div>

        <!-- Tipo -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Tipo
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="flex items-center justify-center h-9 rounded-lg text-[12px] font-semibold transition-all"
              :class="type === 'expense'
                ? 'bg-destructive/12 border border-destructive/25 text-destructive'
                : 'bg-muted/60 border border-border text-muted-foreground'"
              @click="type = 'expense'"
            >
              Despesa
            </button>
            <button
              type="button"
              class="flex items-center justify-center h-9 rounded-lg text-[12px] font-semibold transition-all"
              :class="type === 'income'
                ? 'bg-primary/12 border border-primary/25 text-primary'
                : 'bg-muted/60 border border-border text-muted-foreground'"
              @click="type = 'income'"
            >
              Receita
            </button>
          </div>
        </div>

        <!-- Cor -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Cor
          </p>
          <CategoryColorPicker v-model="color" />
        </div>

        <!-- Ícone -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Ícone
          </p>
          <CategoryIconPicker v-model="icon" :color="color" />
        </div>

        <!-- Meta mensal -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Meta mensal <span class="text-muted-foreground/30 normal-case font-normal">(opcional)</span>
          </p>
          <div class="flex items-center gap-2 h-12 px-4 rounded-lg bg-card border border-border/60 focus-within:border-primary transition-colors">
            <span class="text-[13px] text-muted-foreground shrink-0">R$</span>
            <input
              v-model="monthlyLimit"
              type="number"
              min="0"
              step="10"
              placeholder="Sem meta"
              class="flex-1 bg-transparent text-[13px] outline-none tabular-nums"
            />
            <button
              v-if="monthlyLimit"
              type="button"
              class="text-muted-foreground/40 hover:text-foreground transition-colors"
              @click="monthlyLimit = ''"
            >
              <X :size="13" />
            </button>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-4 pt-3 pb-8 border-t border-border/40 shrink-0 flex gap-2">
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl text-[15px] transition-colors bg-muted/60 border border-border/50 text-muted-foreground"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving || !name.trim()"
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-primary text-background disabled:opacity-40 disabled:cursor-not-allowed"
          @click="save"
        >
          <Loader2 v-if="saving" :size="16" class="animate-spin" />
          <template v-else>
            <CheckCircle :size="16" :stroke-width="2.5" />
            {{ category ? 'Salvar' : 'Criar categoria' }}
          </template>
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
