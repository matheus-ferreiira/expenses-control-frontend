<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { AppFormField } from '@/components/shared'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/composables/useToast'
import { useMoneyField } from '../composables/useMoneyField'
import { todayISO } from '../utils/priceHelpers'
import { pricesApi } from '@/services/api/prices'
import { formatCurrency } from '@/utils/currency'
import type { PricePurchase, PriceSale } from '@/features/prices/types'

const props = defineProps<{
  open: boolean
  /** The purchase being sold. When it already has a sale, the form edits it. */
  purchase: PricePurchase | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [sale: PriceSale]
}>()

const toast = useToast()

const form = reactive({
  sold_at: todayISO(),
  notes: '',
})
const salePrice = useMoneyField()
const errors = reactive<{ sale_price?: string; sold_at?: string }>({})
const submitting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    const sale = props.purchase?.sale
    if (sale) {
      form.sold_at = sale.sold_at
      form.notes = sale.notes ?? ''
      salePrice.setValue(sale.sale_price)
    } else {
      form.sold_at = todayISO()
      form.notes = ''
      salePrice.setValue(null)
    }
    errors.sale_price = undefined
    errors.sold_at = undefined
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!props.purchase) return
  const value = salePrice.toNumber()
  errors.sale_price = value !== null && value > 0 ? undefined : 'Informe o valor da venda'
  errors.sold_at = form.sold_at ? undefined : 'Informe a data'
  if (errors.sale_price || errors.sold_at) return

  submitting.value = true
  try {
    const existing = props.purchase.sale
    const saved = existing
      ? await pricesApi.sales.update(existing.id, {
          sale_price: value!,
          sold_at: form.sold_at,
          notes: form.notes.trim() || null,
        })
      : await pricesApi.sales.create({
          purchase_id: props.purchase.id,
          sale_price: value!,
          sold_at: form.sold_at,
          notes: form.notes.trim() || null,
        })
    toast.success(existing ? 'Venda atualizada' : 'Venda registrada')
    emit('saved', saved)
    close()
  } catch {
    toast.error('Erro ao salvar venda')
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
          {{ purchase?.sale ? 'Editar venda' : 'Registrar venda' }}
        </h3>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Context: what is being sold -->
        <div v-if="purchase" class="rounded-xl bg-card border border-border p-4">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">
            Produto
          </p>
          <p class="text-[14px] font-medium text-foreground">
            {{ purchase.product?.name ?? 'Produto' }}
          </p>
          <p class="text-[12px] text-muted-foreground mt-0.5">
            Pago: <span class="tabular-nums font-semibold">{{ formatCurrency(purchase.price_paid) }}</span>
          </p>
        </div>

        <AppFormField label="Valor da venda (R$)" :error="errors.sale_price" required>
          <div class="w-full flex items-center gap-2 h-14 px-4 rounded-xl bg-card border border-border/60 focus-within:border-primary/60 transition-colors">
            <span class="text-[13px] text-muted-foreground/60 shrink-0">R$</span>
            <input
              :value="salePrice.display.value"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[20px] font-semibold text-foreground outline-none tabular-nums placeholder:text-muted-foreground/40 placeholder:font-normal"
              @input="salePrice.onInput"
            />
          </div>
        </AppFormField>

        <AppFormField label="Data da venda" :error="errors.sold_at" required>
          <DatePicker v-model="form.sold_at" />
        </AppFormField>

        <AppFormField label="Observações">
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Comprador, plataforma..."
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
          {{ purchase?.sale ? 'Salvar' : 'Registrar venda' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
