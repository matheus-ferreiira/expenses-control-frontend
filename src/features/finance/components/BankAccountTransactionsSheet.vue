<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronRight, Link2, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { bankConnectionsApi } from '@/services/api/bankConnections'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { formatDayMonth } from '../utils/financeHelpers'
import type { BankConnectionAccount, BankConnectionTransaction, BankReviewStatus } from '@/types/bankConnections'
import type { PaginationMeta } from '@/types/api'

/** Transações como o banco informou, com a situação de cada uma em relação ao app. */
const props = defineProps<{
  open: boolean
  account: BankConnectionAccount | null
  bankName: string
}>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  /** Abrir "Ligar ao app" para esta conta */
  link: [account: BankConnectionAccount]
  /** Algo mudou (desfazer): o pai recarrega contadores */
  changed: []
}>()

const toast = useToast()
const transactions = ref<BankConnectionTransaction[]>([])
const meta = ref<PaginationMeta | null>(null)
const loading = ref(false)
const error = ref(false)
const undoing = ref<string | null>(null)
let requestId = 0
const hasMore = computed(() => !!meta.value && meta.value.current_page < meta.value.last_page)
const isCard = computed(() => props.account?.type === 'credit')

async function loadPage(page = 1) {
  if (!props.open || !props.account) return
  const id = ++requestId
  loading.value = true
  error.value = false
  try {
    const result = await bankConnectionsApi.transactions(props.account.id, page)
    if (id !== requestId) return
    transactions.value = page === 1 ? result.data : [...transactions.value, ...result.data]
    meta.value = result.meta
  } catch {
    if (id === requestId) error.value = true
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(() => [props.open, props.account?.id], () => {
  requestId++
  transactions.value = []
  meta.value = null
  error.value = false
  loading.value = false
  if (props.open) void loadPage()
}, { immediate: true })

onBeforeUnmount(() => { requestId++ })

function detail(t: BankConnectionTransaction): string {
  const parts = [formatDayMonth(t.date)]
  if (t.total_installments && t.installment_number) parts.push(`parcela ${t.installment_number}/${t.total_installments}`)
  if (t.status === 'pending') parts.push(isCard.value ? 'na fatura aberta' : 'a confirmar no banco')
  return parts.join(' · ')
}

const STATUS: Record<Exclude<BankReviewStatus, null>, { label: string; tone: string }> = {
  new: { label: 'A lançar', tone: 'text-warning' },
  matched: { label: 'No app', tone: 'text-success' },
  imported: { label: 'Lançada', tone: 'text-success' },
  ignored: { label: 'Ignorada', tone: 'text-muted-foreground' },
  before_start: { label: 'Antes do início', tone: 'text-muted-foreground' },
}

async function undo(t: BankConnectionTransaction) {
  if (undoing.value) return
  undoing.value = t.id
  try {
    const updated = await bankConnectionsApi.undo(t.id)
    transactions.value = transactions.value.map((row) => (row.id === t.id ? updated : row))
    toast.success(t.review_status === 'imported' ? 'Lançamento desfeito: voltou para "A lançar"' : 'Voltou para "A lançar"')
    emit('changed')
  } catch {
    toast.error('Não foi possível desfazer')
  } finally {
    undoing.value = null
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-2xl max-w-xl mx-auto p-0 max-h-[85dvh] flex flex-col">
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border shrink-0" />
      <SheetHeader class="px-5 pt-3 pb-4 text-left shrink-0">
        <SheetTitle class="text-[15px] pr-6">{{ account?.name }}</SheetTitle>
        <SheetDescription class="text-[12px]">{{ bankName }} · como o banco informou.</SheetDescription>
        <button
          v-if="account"
          type="button"
          class="mt-2 w-full flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-[12px] text-left hover:opacity-80 transition-opacity"
          @click="emit('link', account)"
        >
          <span class="inline-flex items-center gap-1.5 min-w-0">
            <Link2 :size="14" class="shrink-0" :class="account.link ? 'text-primary' : 'text-muted-foreground'" />
            <span v-if="account.link" class="truncate">
              Ligada a <span class="font-medium">{{ account.link.name }}</span>
              <span v-if="account.link.import_from" class="text-muted-foreground"> · lança desde {{ formatDate(account.link.import_from) }}</span>
            </span>
            <span v-else class="text-muted-foreground">Ligue a {{ isCard ? 'um cartão' : 'uma conta' }} do app para lançar o que falta</span>
          </span>
          <ChevronRight :size="14" class="text-muted-foreground shrink-0" />
        </button>
      </SheetHeader>

      <div class="overflow-y-auto min-h-0 border-t border-border pb-5" :aria-busy="loading">
        <ul class="divide-y divide-border">
          <li v-for="t in transactions" :key="t.id" class="flex items-center gap-3 px-5 py-3">
            <span class="flex-1 min-w-0">
              <span class="block text-[13px] font-medium truncate">{{ t.description }}</span>
              <span class="block text-[11px] text-muted-foreground truncate">
                {{ detail(t) }}
                <template v-if="t.review_status">
                  · <span :class="STATUS[t.review_status].tone">{{ STATUS[t.review_status].label }}</span>
                </template>
                <button
                  v-if="t.review_status === 'imported' || t.review_status === 'ignored'"
                  type="button"
                  class="ml-1 text-primary font-medium disabled:opacity-40"
                  :disabled="undoing === t.id"
                  @click="undo(t)"
                >
                  Desfazer
                </button>
              </span>
            </span>
            <span
              class="text-[13px] font-medium tabular-nums whitespace-nowrap shrink-0"
              :class="t.direction === 'in' ? 'text-success' : 'text-foreground'"
            >{{ t.direction === 'in' ? '+' : '−' }}{{ formatCurrency(t.amount_cents / 100) }}</span>
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
          O banco ainda não informou transações desta conta.
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
