<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronRight, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { financeApi } from '@/services/api/finance'
import { formatCurrency } from '@/utils/currency'
import { cycleLabel, formatDayMonth } from '../utils/financeHelpers'
import type { CategoryBreakdownItem, Transaction } from '@/types/finance'
import type { PaginationMeta } from '@/types/api'

const props = defineProps<{
  open: boolean
  category: CategoryBreakdownItem | null
  type: 'income' | 'expense'
  month: string
  /** Rows open the transaction (Visão Geral); off where there is no detail sheet to open (reports) */
  readonly?: boolean
}>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  select: [transaction: Transaction]
}>()

const transactions = ref<Transaction[]>([])
const meta = ref<PaginationMeta | null>(null)
const loading = ref(false)
const error = ref(false)
let requestId = 0
const hasMore = computed(() => meta.value && meta.value.current_page < meta.value.last_page)

async function loadPage(page = 1) {
  if (!props.open || !props.category) return
  const id = ++requestId
  const [year, month] = props.month.split('-').map(Number)
  loading.value = true
  error.value = false
  try {
    const result = await financeApi.categoryTransactions({
      year: year!, month: month!, type: props.type,
      category_id: props.category.category_id, page,
    })
    if (id !== requestId) return
    transactions.value = page === 1 ? result.data : [...transactions.value, ...result.data]
    meta.value = result.meta
  } catch {
    if (id === requestId) error.value = true
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(() => [props.open, props.category?.category_id, props.type, props.month], () => {
  requestId++
  transactions.value = []
  meta.value = null
  error.value = false
  loading.value = false
  if (props.open) void loadPage()
}, { immediate: true })

onBeforeUnmount(() => { requestId++ })
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-2xl max-w-xl mx-auto p-0 max-h-[85dvh] flex flex-col">
      <SheetHeader class="px-5 pt-5 pb-4 text-left shrink-0">
        <SheetTitle class="text-[16px] pr-6">{{ category?.category }}</SheetTitle>
        <SheetDescription class="text-[12px]">
          {{ type === 'income' ? 'Receitas' : 'Despesas' }} · {{ cycleLabel(month) }}
        </SheetDescription>
        <p class="text-[22px] font-semibold tabular-nums" :class="type === 'income' ? 'text-success' : 'text-destructive'">
          {{ formatCurrency(category?.total ?? 0) }}
        </p>
        <p class="text-[11px] text-muted-foreground">
          Transações confirmadas. Em despesas compartilhadas, considera apenas sua parte.
        </p>
      </SheetHeader>

      <div class="overflow-y-auto min-h-0 border-t border-border pb-5" :aria-busy="loading">
        <ul class="divide-y divide-border">
          <li v-for="transaction in transactions" :key="transaction.id">
            <component
              :is="readonly ? 'div' : 'button'"
              :type="readonly ? undefined : 'button'"
              class="w-full flex items-center gap-3 px-5 py-3 text-left"
              :class="readonly ? '' : 'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'"
              @click="!readonly && emit('select', transaction)"
            >
              <span class="flex-1 min-w-0">
                <span class="block text-[13px] font-medium truncate">{{ transaction.description }}</span>
                <span class="block text-[11px] text-muted-foreground">{{ formatDayMonth(transaction.transaction_date) }}</span>
              </span>
              <span class="text-[13px] font-medium tabular-nums shrink-0" :class="type === 'income' ? 'text-success' : 'text-destructive'">
                {{ formatCurrency((transaction.economic_effect?.[type] ?? 0) / 100) }}
              </span>
              <ChevronRight v-if="!readonly" :size="14" class="text-muted-foreground shrink-0" aria-hidden="true" />
            </component>
          </li>
        </ul>
        <div v-if="loading" role="status" class="flex items-center justify-center gap-2 p-5 text-[12px] text-muted-foreground">
          <Loader2 :size="16" class="animate-spin" aria-hidden="true" /> Carregando transações...
        </div>
        <div v-else-if="error" role="alert" class="px-5 py-4 text-center text-[12px]">
          <p class="text-muted-foreground">Não foi possível carregar as transações.</p>
          <button type="button" class="mt-2 text-primary font-medium" @click="loadPage((meta?.current_page ?? 0) + 1)">
            Tentar novamente
          </button>
        </div>
        <p v-else-if="!transactions.length" class="px-5 py-6 text-[12px] text-center text-muted-foreground">
          Nenhuma transação confirmada nesta categoria no mês selecionado.
        </p>
        <button
          v-else-if="hasMore"
          type="button"
          class="block mx-auto mt-4 text-[12px] font-medium text-primary"
          @click="loadPage((meta?.current_page ?? 0) + 1)"
        >
          Carregar mais ({{ transactions.length }} de {{ meta?.total }})
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
