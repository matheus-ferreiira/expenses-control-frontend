<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import type { BudgetItem, TransactionCategory } from '@/types/finance'

const props = defineProps<{
  open: boolean
  baseAmount: number
  categories: TransactionCategory[]
  editingItem?: BudgetItem | null
  usedCategoryIds?: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [item: { category_id: string; amount: number; percentage: number }]
}>()

const selectedCategoryId = ref('')
const amountInputRef = ref<HTMLInputElement | null>(null)
const percentInputRef = ref<HTMLInputElement | null>(null)
const amountRaw = ref('')
const percentRaw = ref('')
const submitting = ref(false)

const availableCategories = computed(() =>
  props.categories.filter(
    (c) =>
      c.type === 'expense' &&
      (!props.usedCategoryIds?.includes(c.id) || c.id === selectedCategoryId.value),
  ),
)

const isFormValid = computed(() => {
  const amt = parseFloat(amountRaw.value.replace(',', '.'))
  return !!selectedCategoryId.value && !isNaN(amt) && amt > 0
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.editingItem) {
        selectedCategoryId.value = props.editingItem.category_id
        amountRaw.value = Number(props.editingItem.amount).toFixed(2).replace('.', ',')
        percentRaw.value = Number(props.editingItem.percentage).toFixed(2).replace('.', ',')
        nextTick(() => {
          if (amountInputRef.value) {
            amountInputRef.value.value = amountRaw.value
          }
          if (percentInputRef.value) {
            percentInputRef.value.value = percentRaw.value
          }
        })
      } else {
        selectedCategoryId.value = ''
        amountRaw.value = ''
        percentRaw.value = ''
        nextTick(() => {
          if (amountInputRef.value) amountInputRef.value.value = ''
          if (percentInputRef.value) percentInputRef.value.value = ''
        })
      }
    }
  },
)

function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function onAmountInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  const floatVal = digits ? parseInt(digits, 10) / 100 : 0
  amountRaw.value = digits ? floatVal.toFixed(2).replace('.', ',') : ''
  ;(e.target as HTMLInputElement).value = formatAmount(digits)
  // Sync percentage
  if (props.baseAmount > 0 && floatVal > 0) {
    const pct = Math.round((floatVal / props.baseAmount) * 10000) / 100
    percentRaw.value = pct.toFixed(2).replace('.', ',')
    if (percentInputRef.value) percentInputRef.value.value = percentRaw.value
  }
}

function onAmountFocus(e: Event) {
  const input = e.target as HTMLInputElement
  setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0)
}

function onPercentInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(',', '.')
  const pct = parseFloat(raw)
  percentRaw.value = raw.replace('.', ',')
  if (!isNaN(pct) && props.baseAmount > 0) {
    const amount = Math.round((pct / 100) * props.baseAmount * 100) / 100
    amountRaw.value = amount.toFixed(2).replace('.', ',')
    if (amountInputRef.value) {
      amountInputRef.value.value = amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
  }
}

function close() {
  emit('update:open', false)
}

function submit() {
  if (!isFormValid.value || submitting.value) return
  const amount = parseFloat(amountRaw.value.replace(',', '.'))
  const percentage =
    percentRaw.value ? parseFloat(percentRaw.value.replace(',', '.')) : 0
  emit('confirm', {
    category_id: selectedCategoryId.value,
    amount,
    percentage,
  })
  close()
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-border shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
          @click="close"
        >
          <ArrowLeft :size="18" aria-hidden="true" />
        </button>
        <h3 class="text-[15px] font-semibold leading-none">
          {{ editingItem ? 'Editar limite' : 'Definir limite' }}
        </h3>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Categoria -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Categoria <span class="text-destructive">*</span>
          </p>
          <div class="grid grid-cols-4 gap-3 max-h-[240px] overflow-y-auto pr-0.5">
            <button
              v-for="cat in availableCategories"
              :key="cat.id"
              type="button"
              class="flex flex-col items-center transition-all active:scale-95"
              @click="selectedCategoryId = selectedCategoryId === cat.id ? '' : cat.id"
            >
              <span
                class="size-14 rounded-xl flex items-center justify-center transition-all"
                :style="selectedCategoryId === cat.id
                  ? { background: cat.color + '30', outline: '1.5px solid ' + cat.color + '60' }
                  : { background: cat.color + '18' }"
              >
                <component
                  v-if="cat.icon && findIcon(cat.icon)"
                  :is="findIcon(cat.icon)!.component"
                  :size="24"
                  :style="{ color: cat.color }"
                />
                <span v-else class="text-[14px] font-bold" :style="{ color: cat.color }">
                  {{ cat.name.charAt(0) }}
                </span>
              </span>
              <span class="text-[11px] text-muted-foreground mt-1.5 truncate max-w-[56px] text-center leading-tight">
                {{ cat.name }}
              </span>
            </button>
          </div>
          <p v-if="availableCategories.length === 0" class="text-[12px] text-muted-foreground text-center py-4">
            Todas as categorias de despesa já foram adicionadas
          </p>
        </div>

        <!-- Valor -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Valor (R$)
          </p>
          <div class="flex items-center gap-2 h-10 px-3 rounded-lg bg-card focus-within: transition-colors">
            <span class="text-[12px] text-muted-foreground shrink-0">R$</span>
            <input
              ref="amountInputRef"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
              @input="onAmountInput"
              @focus="onAmountFocus"
            />
          </div>
        </div>

        <!-- Percentual -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Percentual do orçamento base (%)
          </p>
          <div class="flex items-center gap-2 h-10 px-3 rounded-lg bg-card focus-within: transition-colors">
            <input
              ref="percentInputRef"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
              @input="onPercentInput"
            />
            <span class="text-[12px] text-muted-foreground shrink-0">%</span>
          </div>
          <p v-if="baseAmount > 0" class="text-[11px] text-muted-foreground mt-1">
            Base: R$ {{ baseAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </p>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-4 pt-3 pb-8 border-t border-border shrink-0 flex gap-2">
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl text-[15px] transition-colors bg-muted text-muted-foreground"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!isFormValid || submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          Confirmar
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
