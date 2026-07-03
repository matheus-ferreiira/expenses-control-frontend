<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-vue-next'
import { isAxiosError } from 'axios'
import { findIcon } from '@/lib/icons'
import { useToast } from '@/composables/useToast'
import { useFinanceStore } from '@/stores/finance'
import type { Budget, BudgetItem } from '@/types/finance'
import BudgetItemSheet from './BudgetItemSheet.vue'

const props = defineProps<{
  open: boolean
  month: number
  year: number
  budget: Budget | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [budget: Budget]
}>()

const store = useFinanceStore()
const toast = useToast()

const baseAmountInputRef = ref<HTMLInputElement | null>(null)
const baseAmountRaw = ref('')
const items = ref<Array<{ category_id: string; amount: number; percentage: number }>>([])
const submitting = ref(false)
const itemSheetOpen = ref(false)
const editingItemIdx = ref<number | null>(null)

const editingItem = computed<BudgetItem | null>(() => {
  if (editingItemIdx.value === null) return null
  const item = items.value[editingItemIdx.value]
  if (!item) return null
  const cat = store.categories.find((c) => c.id === item.category_id)
  return {
    id: '',
    category_id: item.category_id,
    category_name: cat?.name ?? null,
    category_color: cat?.color ?? null,
    category_icon: cat?.icon ?? null,
    amount: item.amount,
    percentage: item.percentage,
    spent: 0,
    spent_percentage: 0,
    remaining: item.amount,
    status: 'on_track',
  }
})

const usedCategoryIds = computed(() => items.value.map((i) => i.category_id))

const baseAmount = computed(() => {
  const v = parseFloat(baseAmountRaw.value.replace(',', '.'))
  return isNaN(v) ? 0 : v
})

// Soma das % dos itens (derivada de amount/baseAmount)
const itemsPercentageTotal = computed(() => {
  if (baseAmount.value <= 0) return 0
  return items.value.reduce((sum, i) => sum + (i.amount / baseAmount.value) * 100, 0)
})

// Soma das % das metas ativas (do store)
const goalsPercentageTotal = computed(() => {
  if (baseAmount.value <= 0) return 0
  return store.goals
    .filter((g) => g.status === 'active' && g.monthly_contribution > 0)
    .reduce((sum, g) => sum + (g.monthly_contribution / baseAmount.value) * 100, 0)
})

const totalAllocatedPercentage = computed(() =>
  Math.round((itemsPercentageTotal.value + goalsPercentageTotal.value) * 100) / 100,
)

const percentageOverflowError = computed(() =>
  totalAllocatedPercentage.value > 100
    ? `Total alocado excede 100% do valor base (${totalAllocatedPercentage.value.toFixed(1)}%). Reduza os limites antes de salvar.`
    : null,
)

const isFormValid = computed(() => baseAmount.value > 0 && !percentageOverflowError.value)

function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function onBaseAmountInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  baseAmountRaw.value = digits ? (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',') : ''
  ;(e.target as HTMLInputElement).value = formatAmount(digits)
}

function onBaseAmountFocus(e: Event) {
  const input = e.target as HTMLInputElement
  setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.budget) {
        baseAmountRaw.value = Number(props.budget.base_amount).toFixed(2).replace('.', ',')
        items.value = props.budget.items.map((i) => ({
          category_id: i.category_id,
          amount: i.amount,
          percentage: i.percentage,
        }))
      } else {
        baseAmountRaw.value = ''
        items.value = []
      }
      nextTick(() => {
        if (baseAmountInputRef.value && baseAmountRaw.value) {
          baseAmountInputRef.value.value = formatAmount(
            String(Math.round(parseFloat(baseAmountRaw.value.replace(',', '.')) * 100)),
          )
        } else if (baseAmountInputRef.value) {
          baseAmountInputRef.value.value = ''
        }
      })
    }
  },
)

function getCategoryById(id: string) {
  return store.categories.find((c) => c.id === id)
}

function openAddItem() {
  editingItemIdx.value = null
  itemSheetOpen.value = true
}

function openEditItem(idx: number) {
  editingItemIdx.value = idx
  itemSheetOpen.value = true
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

function onItemConfirm(item: { category_id: string; amount: number; percentage: number }) {
  if (editingItemIdx.value !== null) {
    items.value[editingItemIdx.value] = item
    editingItemIdx.value = null
  } else {
    items.value.push(item)
  }
}

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!isFormValid.value || submitting.value) return
  submitting.value = true
  try {
    const payload = {
      month: props.month,
      year: props.year,
      base_amount: baseAmount.value,
      items: items.value,
    }

    let saved: Budget
    if (props.budget) {
      saved = await store.updateBudget(props.budget.id, payload)
      toast.success('Orçamento atualizado')
    } else {
      saved = await store.createBudget(payload)
      toast.success('Orçamento criado')
    }
    emit('saved', saved)
    close()
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 422) {
      const errors = err.response.data?.errors ?? {}
      const itemsError = errors['items']
      if (itemsError) {
        const msg = Array.isArray(itemsError) ? itemsError[0] : itemsError
        toast.error(String(msg))
      } else {
        toast.error('Verifique os campos do formulário')
      }
    } else {
      toast.error('Erro ao salvar orçamento')
    }
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
          {{ budget ? 'Editar orçamento' : 'Configurar orçamento' }}
        </h3>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Valor base -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Valor base (R$) <span class="text-destructive">*</span>
          </p>
          <div class="flex items-center gap-2 h-10 px-3 rounded-lg bg-card focus-within: transition-colors">
            <span class="text-[12px] text-muted-foreground shrink-0">R$</span>
            <input
              ref="baseAmountInputRef"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
              @input="onBaseAmountInput"
              @focus="onBaseAmountFocus"
            />
          </div>
          <p class="text-[11px] text-muted-foreground mt-1">
            Ex: seu salário ou renda mensal
          </p>
        </div>

        <!-- Itens do orçamento -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Categorias com limite
          </p>

          <!-- Lista de itens -->
          <div v-if="items.length > 0" class="space-y-1.5 mb-3">
            <div
              v-for="(item, idx) in items"
              :key="item.category_id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card "
            >
              <span
                class="size-9 rounded-lg flex items-center justify-center shrink-0"
                :style="{ background: (getCategoryById(item.category_id)?.color ?? '#888') + '20' }"
              >
                <component
                  v-if="getCategoryById(item.category_id)?.icon && findIcon(getCategoryById(item.category_id)!.icon!)"
                  :is="findIcon(getCategoryById(item.category_id)!.icon!)!.component"
                  :size="18"
                  :style="{ color: getCategoryById(item.category_id)?.color ?? '#888' }"
                />
                <span v-else class="text-[12px] font-bold" :style="{ color: getCategoryById(item.category_id)?.color ?? '#888' }">
                  {{ getCategoryById(item.category_id)?.name?.charAt(0) ?? '?' }}
                </span>
              </span>

              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-foreground truncate">
                  {{ getCategoryById(item.category_id)?.name ?? item.category_id }}
                </p>
                <p class="text-[11px] text-muted-foreground tabular-nums">
                  R$ {{ item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  · {{ baseAmount > 0 ? ((item.amount / baseAmount) * 100).toFixed(1) : '0.0' }}%
                </p>
              </div>

              <button
                type="button"
                class="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                @click="openEditItem(idx)"
              >
                <span class="text-[11px]">Editar</span>
              </button>

              <button
                type="button"
                class="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors shrink-0"
                @click="removeItem(idx)"
              >
                <X :size="14" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Erro de % inline -->
          <p v-if="percentageOverflowError" class="text-[12px] text-destructive mb-2 leading-snug">
            {{ percentageOverflowError }}
          </p>

          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-border text-[13px] text-muted-foreground hover:text-primary transition-colors"
            @click="openAddItem"
          >
            <Plus :size="16" />
            Adicionar categoria
          </button>
        </div>

        <!-- Resumo de alocação -->
        <div v-if="baseAmount > 0 && (items.length > 0 || store.goals.some(g => g.status === 'active' && g.monthly_contribution > 0))">
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Resumo da alocação
          </p>
          <div class="bg-card rounded-lg px-3 py-2.5 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[12px] text-muted-foreground">Categorias</span>
              <span class="text-[12px] tabular-nums text-foreground">
                {{ itemsPercentageTotal.toFixed(1) }}%
              </span>
            </div>
            <div
              v-if="store.goals.some(g => g.status === 'active' && g.monthly_contribution > 0)"
              class="flex items-center justify-between"
            >
              <span class="text-[12px] text-muted-foreground">Metas</span>
              <span class="text-[12px] tabular-nums text-foreground">
                {{ goalsPercentageTotal.toFixed(1) }}%
              </span>
            </div>
            <div class="border-t border-border pt-1.5 flex items-center justify-between">
              <span class="text-[12px] font-medium text-foreground">Total alocado</span>
              <span
                class="text-[12px] font-semibold tabular-nums"
                :class="totalAllocatedPercentage > 100 ? 'text-destructive' : 'text-foreground'"
              >
                {{ totalAllocatedPercentage.toFixed(1) }}%
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[12px] text-success">Livre</span>
              <span class="text-[12px] tabular-nums text-success">
                {{ Math.max(0, 100 - totalAllocatedPercentage).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

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
          :disabled="!isFormValid || submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ budget ? 'Salvar orçamento' : 'Criar orçamento' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>

  <BudgetItemSheet
    v-model:open="itemSheetOpen"
    :base-amount="baseAmount"
    :categories="store.categories"
    :editing-item="editingItem"
    :used-category-ids="usedCategoryIds"
    @confirm="onItemConfirm"
  />
</template>
