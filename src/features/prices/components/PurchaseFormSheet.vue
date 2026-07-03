<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-vue-next'
import { AppFormField } from '@/components/shared'
import { DatePicker } from '@/components/ui/date-picker'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import { useMoneyField } from '../composables/useMoneyField'
import { todayISO } from '../utils/priceHelpers'
import { pricesApi } from '@/services/api/prices'
import type { PricePurchase, PricePurchasePayload } from '@/features/prices/types'

const props = defineProps<{
  open: boolean
  purchase?: PricePurchase | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [purchase: PricePurchase]
}>()

const store = usePricesStore()
const toast = useToast()

const form = reactive({
  product_id: '',
  store_id: '',
  purchased_at: todayISO(),
  warranty_months: '',
  notes: '',
})
const pricePaid = useMoneyField()
const currentValue = useMoneyField()
const errors = reactive<{ product_id?: string; price_paid?: string; purchased_at?: string }>({})
const submitting = ref(false)

function resetForm() {
  form.product_id = ''
  form.store_id = ''
  form.purchased_at = todayISO()
  form.warranty_months = ''
  form.notes = ''
  pricePaid.setValue(null)
  currentValue.setValue(null)
  errors.product_id = undefined
  errors.price_paid = undefined
  errors.purchased_at = undefined
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    store.ensureCatalog()
    if (props.purchase) {
      form.product_id = props.purchase.product_id
      form.store_id = props.purchase.store_id ?? ''
      form.purchased_at = props.purchase.purchased_at
      form.warranty_months = props.purchase.warranty_months !== null ? String(props.purchase.warranty_months) : ''
      form.notes = props.purchase.notes ?? ''
      pricePaid.setValue(props.purchase.price_paid)
      currentValue.setValue(props.purchase.current_value)
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
  const value = pricePaid.toNumber()
  errors.price_paid = value !== null && value > 0 ? undefined : 'Informe o valor pago'
  errors.purchased_at = form.purchased_at ? undefined : 'Informe a data'
  return !errors.product_id && !errors.price_paid && !errors.purchased_at
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const warranty = parseInt(form.warranty_months, 10)
    const payload: PricePurchasePayload = {
      product_id: form.product_id,
      store_id: form.store_id || null,
      price_paid: pricePaid.toNumber()!,
      purchased_at: form.purchased_at,
      warranty_months: isNaN(warranty) ? null : warranty,
      current_value: currentValue.toNumber(),
      notes: form.notes.trim() || null,
    }
    const saved = props.purchase
      ? await pricesApi.purchases.update(props.purchase.id, payload)
      : await pricesApi.purchases.create(payload)
    toast.success(props.purchase ? 'Compra atualizada' : 'Compra registrada')
    emit('saved', saved)
    close()
  } catch {
    toast.error('Erro ao salvar compra')
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
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
          @click="close"
        >
          <ArrowLeft :size="18" />
        </button>
        <h3 class="text-[15px] font-semibold leading-none">
          {{ purchase ? 'Editar compra' : 'Nova compra' }}
        </h3>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <AppFormField label="Produto" :error="errors.product_id" required>
          <div class="relative">
            <select
              v-model="form.product_id"
              class="w-full h-10 rounded-lg bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer transition-colors"
              :class="!form.product_id ? 'text-muted-foreground' : ''"
            >
              <option value="" disabled>Selecione o produto</option>
              <option v-for="p in store.products" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <ChevronDown
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </AppFormField>

        <AppFormField label="Valor pago (R$)" :error="errors.price_paid" required>
          <div class="w-full flex items-center gap-2 h-10 px-3 rounded-lg bg-card focus-within: transition-colors">
            <span class="text-[12px] text-muted-foreground shrink-0">R$</span>
            <input
              :value="pricePaid.display.value"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
              @input="pricePaid.onInput"
            />
          </div>
        </AppFormField>

        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Data da compra" :error="errors.purchased_at" required>
            <DatePicker v-model="form.purchased_at" />
          </AppFormField>
          <AppFormField label="Garantia (meses)">
            <input
              v-model="form.warranty_months"
              type="text"
              inputmode="numeric"
              placeholder="12"
              class="w-full h-10 rounded-lg bg-card px-3 text-[13px] text-center text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
            />
          </AppFormField>
        </div>

        <AppFormField label="Loja">
          <div class="relative">
            <select
              v-model="form.store_id"
              class="w-full h-10 rounded-lg bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer transition-colors"
              :class="!form.store_id ? 'text-muted-foreground' : ''"
            >
              <option value="">Sem loja</option>
              <option v-for="s in store.stores" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
            <ChevronDown
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </AppFormField>

        <AppFormField label="Valor atual estimado (R$)" hint="Base do cálculo de depreciação">
          <div class="w-full flex items-center gap-2 h-10 px-3 rounded-lg bg-card focus-within: transition-colors">
            <span class="text-[12px] text-muted-foreground shrink-0">R$</span>
            <input
              :value="currentValue.display.value"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
              @input="currentValue.onInput"
            />
          </div>
        </AppFormField>

        <AppFormField label="Observações">
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Nota fiscal, condição..."
            class="w-full rounded-lg bg-card px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground resize-none"
          />
        </AppFormField>

      </div>

      <!-- Footer -->
      <div class="px-4 pt-3 pb-8 border-t border-border shrink-0 flex gap-2">
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl text-[15px] transition-colors bg-muted text-muted-foreground"
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
          {{ purchase ? 'Salvar' : 'Registrar compra' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
