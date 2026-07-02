<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-vue-next'
import { AppFormField } from '@/components/shared'
import { DatePicker } from '@/components/ui/date-picker'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import { useMoneyField } from '../composables/useMoneyField'
import { todayISO } from '../utils/priceHelpers'
import { pricesApi } from '@/services/api/prices'
import type { PriceRecord, PriceRecordPayload } from '@/features/prices/types'
import { ROUTES } from '@/constants/routes'

const props = defineProps<{
  open: boolean
  record?: PriceRecord | null
  /** Pre-selects a product on create (e.g. from the product detail page). */
  presetProductId?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [record: PriceRecord]
}>()

const store = usePricesStore()
const toast = useToast()

const form = reactive({
  product_id: '',
  store_id: '',
  recorded_at: todayISO(),
  url: '',
  notes: '',
})
const price = useMoneyField()
const errors = reactive<{ product_id?: string; store_id?: string; price?: string; recorded_at?: string }>({})
const submitting = ref(false)

function resetForm() {
  form.product_id = props.presetProductId ?? ''
  form.store_id = ''
  form.recorded_at = todayISO()
  form.url = ''
  form.notes = ''
  price.setValue(null)
  errors.product_id = undefined
  errors.store_id = undefined
  errors.price = undefined
  errors.recorded_at = undefined
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    store.ensureCatalog()
    if (props.record) {
      form.product_id = props.record.product_id
      form.store_id = props.record.store_id
      form.recorded_at = props.record.recorded_at
      form.url = props.record.url ?? ''
      form.notes = props.record.notes ?? ''
      price.setValue(props.record.price)
    } else {
      resetForm()
    }
  },
)

function close() {
  emit('update:open', false)
}

function validate(): boolean {
  errors.product_id = form.product_id ? undefined : 'Selecione o produto'
  errors.store_id = form.store_id ? undefined : 'Selecione a loja'
  const value = price.toNumber()
  errors.price = value !== null && value > 0 ? undefined : 'Informe o preço'
  errors.recorded_at = form.recorded_at ? undefined : 'Informe a data'
  return !errors.product_id && !errors.store_id && !errors.price && !errors.recorded_at
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload: PriceRecordPayload = {
      product_id: form.product_id,
      store_id: form.store_id,
      price: price.toNumber()!,
      recorded_at: form.recorded_at,
      url: form.url.trim() || null,
      notes: form.notes.trim() || null,
    }
    const saved = props.record
      ? await pricesApi.priceRecords.update(props.record.id, payload)
      : await pricesApi.priceRecords.create(payload)
    toast.success(props.record ? 'Registro atualizado' : 'Preço registrado')
    emit('saved', saved)
    close()
  } catch {
    toast.error('Erro ao salvar registro de preço')
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
          {{ record ? 'Editar registro' : 'Registrar preço' }}
        </h3>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Price — hero input -->
        <AppFormField label="Preço (R$)" :error="errors.price" required>
          <div class="w-full flex items-center gap-2 h-14 px-4 rounded-xl bg-card border border-border/60 focus-within:border-primary/60 transition-colors">
            <span class="text-[13px] text-muted-foreground/60 shrink-0">R$</span>
            <input
              :value="price.display.value"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[20px] font-semibold text-foreground outline-none tabular-nums placeholder:text-muted-foreground/40 placeholder:font-normal"
              @input="price.onInput"
            />
          </div>
        </AppFormField>

        <!-- Product -->
        <AppFormField label="Produto" :error="errors.product_id" required>
          <div class="relative">
            <select
              v-model="form.product_id"
              class="w-full h-10 rounded-lg border border-border/60 bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
              :class="!form.product_id ? 'text-muted-foreground/50' : ''"
            >
              <option value="" disabled>Selecione o produto</option>
              <option v-for="p in store.products" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <ChevronDown
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            />
          </div>
          <p v-if="!store.loadingProducts && store.products.length === 0" class="text-[12px] text-muted-foreground/60 mt-1.5">
            Nenhum produto cadastrado.
            <RouterLink :to="{ name: ROUTES.PRICES_PRODUCTS }" class="text-primary hover:text-primary/80 transition-colors" @click="close">
              Criar produto
            </RouterLink>
          </p>
        </AppFormField>

        <!-- Store -->
        <AppFormField label="Loja" :error="errors.store_id" required>
          <div class="relative">
            <select
              v-model="form.store_id"
              class="w-full h-10 rounded-lg border border-border/60 bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
              :class="!form.store_id ? 'text-muted-foreground/50' : ''"
            >
              <option value="" disabled>Selecione a loja</option>
              <option v-for="s in store.stores" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
            <ChevronDown
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            />
          </div>
          <p v-if="!store.loadingStores && store.stores.length === 0" class="text-[12px] text-muted-foreground/60 mt-1.5">
            Nenhuma loja cadastrada.
            <RouterLink :to="{ name: ROUTES.PRICES_PRODUCTS }" class="text-primary hover:text-primary/80 transition-colors" @click="close">
              Gerenciar lojas
            </RouterLink>
          </p>
        </AppFormField>

        <!-- Date -->
        <AppFormField label="Data da pesquisa" :error="errors.recorded_at" required>
          <DatePicker v-model="form.recorded_at" />
        </AppFormField>

        <!-- URL -->
        <AppFormField label="Link da oferta">
          <input
            v-model="form.url"
            type="url"
            inputmode="url"
            placeholder="https://..."
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          />
        </AppFormField>

        <!-- Notes -->
        <AppFormField label="Observações">
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Cupom, condição de pagamento..."
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
          {{ record ? 'Salvar' : 'Registrar' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
