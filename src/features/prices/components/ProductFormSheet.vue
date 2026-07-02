<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-vue-next'
import { AppFormField } from '@/components/shared'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import { useMoneyField } from '../composables/useMoneyField'
import type {
  PriceProduct,
  PriceProductPayload,
  PriceProductStatus,
} from '@/features/prices/types'
import { PRICE_PRODUCT_STATUS_LABELS } from '@/features/prices/types'

const props = defineProps<{
  open: boolean
  product?: PriceProduct | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [product: PriceProduct]
}>()

const store = usePricesStore()
const toast = useToast()

const STATUSES: PriceProductStatus[] = ['tracking', 'purchased', 'discarded']

const form = reactive({
  name: '',
  category_id: '',
  brand: '',
  model: '',
  specs: '',
  notes: '',
  status: 'tracking' as PriceProductStatus,
})
const targetPrice = useMoneyField()
const launchPrice = useMoneyField()
const errors = reactive<{ name?: string }>({})
const submitting = ref(false)

function resetForm() {
  form.name = ''
  form.category_id = ''
  form.brand = ''
  form.model = ''
  form.specs = ''
  form.notes = ''
  form.status = 'tracking'
  targetPrice.setValue(null)
  launchPrice.setValue(null)
  errors.name = undefined
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    if (!store.categories.length) store.fetchCategories()
    if (props.product) {
      form.name = props.product.name
      form.category_id = props.product.category_id ?? ''
      form.brand = props.product.brand ?? ''
      form.model = props.product.model ?? ''
      form.specs = props.product.specs ?? ''
      form.notes = props.product.notes ?? ''
      form.status = props.product.status
      targetPrice.setValue(props.product.target_price)
      launchPrice.setValue(props.product.launch_price)
    } else {
      resetForm()
    }
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  errors.name = form.name.trim() ? undefined : 'Informe o nome do produto'
  if (errors.name) return
  submitting.value = true
  try {
    const payload: PriceProductPayload = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      specs: form.specs.trim() || null,
      notes: form.notes.trim() || null,
      target_price: targetPrice.toNumber(),
      launch_price: launchPrice.toNumber(),
      status: form.status,
    }
    const saved = props.product
      ? await store.updateProduct(props.product.id, payload)
      : await store.createProduct(payload)
    toast.success(props.product ? 'Produto atualizado' : 'Produto criado')
    emit('saved', saved)
    close()
  } catch {
    toast.error('Erro ao salvar produto')
  } finally {
    submitting.value = false
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
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

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
          {{ product ? 'Editar produto' : 'Novo produto' }}
        </h3>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <AppFormField label="Nome" :error="errors.name" required>
          <input
            v-model="form.name"
            type="text"
            placeholder="Ex: RX 9070 XT"
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          />
        </AppFormField>

        <!-- Status pills — selection via bg, never border -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-1.5">Status</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="s in STATUSES"
              :key="s"
              type="button"
              class="h-10 rounded-lg text-[12px] font-medium transition-colors"
              :class="form.status === s
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50'"
              @click="form.status = s"
            >
              {{ PRICE_PRODUCT_STATUS_LABELS[s] }}
            </button>
          </div>
        </div>

        <AppFormField label="Categoria">
          <div class="relative">
            <select
              v-model="form.category_id"
              class="w-full h-10 rounded-lg border border-border/60 bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
              :class="!form.category_id ? 'text-muted-foreground/50' : ''"
            >
              <option value="">Sem categoria</option>
              <option v-for="c in store.categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
            <ChevronDown
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            />
          </div>
        </AppFormField>

        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Marca">
            <input
              v-model="form.brand"
              type="text"
              placeholder="Ex: Sapphire"
              class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
            />
          </AppFormField>
          <AppFormField label="Modelo">
            <input
              v-model="form.model"
              type="text"
              placeholder="Ex: Pulse"
              class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
            />
          </AppFormField>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Preço alvo (R$)" hint="Meta para o indicador">
            <div class="w-full flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-border/60 focus-within:border-primary/60 transition-colors">
              <span class="text-[12px] text-muted-foreground/60 shrink-0">R$</span>
              <input
                :value="targetPrice.display.value"
                type="text"
                inputmode="numeric"
                placeholder="0,00"
                class="flex-1 min-w-0 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground/40"
                @input="targetPrice.onInput"
              />
            </div>
          </AppFormField>
          <AppFormField label="Preço lançamento (R$)" hint="Base da economia">
            <div class="w-full flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-border/60 focus-within:border-primary/60 transition-colors">
              <span class="text-[12px] text-muted-foreground/60 shrink-0">R$</span>
              <input
                :value="launchPrice.display.value"
                type="text"
                inputmode="numeric"
                placeholder="0,00"
                class="flex-1 min-w-0 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground/40"
                @input="launchPrice.onInput"
              />
            </div>
          </AppFormField>
        </div>

        <AppFormField label="Especificações">
          <textarea
            v-model="form.specs"
            rows="2"
            placeholder="16GB GDDR6, PCIe 5.0..."
            class="w-full rounded-lg bg-card border border-border/60 px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40 resize-none"
          />
        </AppFormField>

        <AppFormField label="Observações">
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Notas livres sobre o produto"
            class="w-full rounded-lg bg-card border border-border/60 px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40 resize-none"
          />
        </AppFormField>

      </div>

      <!-- Footer -->
      <div class="px-4 pt-3 pb-8 border-t border-border/40 shrink-0 flex gap-2">
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl text-[15px] transition-colors bg-muted/60 border border-border/50 text-muted-foreground"
          :disabled="submitting"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ product ? 'Salvar' : 'Criar produto' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
