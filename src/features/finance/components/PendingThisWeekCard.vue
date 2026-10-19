<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check, CheckCheck, Loader2, Clock } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { financeApi } from '@/services/api/finance'
import { useToast } from '@/composables/useToast'
import { toISODate } from '@/utils/date'
import ConfirmTransactionSheet from './ConfirmTransactionSheet.vue'

const emit = defineEmits<{
  /** Disparado após qualquer confirmação — o pai recarrega resumo/saldos/lista */
  confirmed: []
}>()

const toast = useToast()
const pending = ref<Transaction[]>([])
const loading = ref(true)
const confirmingId = ref<string | null>(null)
const confirmingAll = ref(false)

async function load() {
  loading.value = true
  try {
    const weekAhead = new Date()
    weekAhead.setDate(weekAhead.getDate() + 7)
    const result = await financeApi.transactions.list({
      status: 'pending',
      end_date: toISODate(weekAhead),
      sort_by: 'transaction_date',
      sort_direction: 'asc',
      per_page: 50,
    })
    // Card purchases, installments and subscriptions confirm themselves on their date: nothing to review.
    pending.value = result.data.filter((t) => !(t.card_id && t.type !== 'transfer'))
  } catch {
    pending.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
defineExpose({ reload: load })

const todayStr = toISODate(new Date())
const weekEndLabel = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
})()

function dateLabel(t: Transaction): { text: string; overdue: boolean } {
  if (t.transaction_date < todayStr) {
    const [y, m, d] = t.transaction_date.split('-').map(Number)
    return {
      text: `Atrasada · ${new Date(y!, m! - 1, d!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
      overdue: true,
    }
  }
  if (t.transaction_date === todayStr) return { text: 'Hoje', overdue: false }
  const [y, m, d] = t.transaction_date.split('-').map(Number)
  return {
    text: new Date(y!, m! - 1, d!).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
    overdue: false,
  }
}

// Receber and pagar shown apart: a single net figure (+R$ 2.195) hid what is coming in and going out
const toReceive = computed(() => pending.value.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const toPay = computed(() => pending.value.filter((t) => t.type !== 'income').reduce((s, t) => s + t.amount, 0))

/** Only what is already due can be confirmed in one go, each at its forecast value. */
const duePending = computed(() => pending.value.filter((t) => t.transaction_date <= todayStr))
const totalDue = computed(() =>
  duePending.value.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
)

// "Paguei / Recebi": confirms one item with the real amount and date
const confirmTarget = ref<Transaction | null>(null)
const confirmOpen = ref(false)

function confirmOne(t: Transaction) {
  if (confirmingId.value || confirmingAll.value) return
  confirmTarget.value = t
  confirmOpen.value = true
}

function onConfirmed(t: Transaction) {
  pending.value = pending.value.filter((p) => p.id !== t.id)
  toast.success('Transação confirmada')
  emit('confirmed')
}

async function confirmAll() {
  if (confirmingAll.value || duePending.value.length === 0) return
  if (!window.confirm(`Confirmar ${duePending.value.length} vencidas pelo valor previsto (${formatCurrency(totalDue.value)})?`)) return
  confirmingAll.value = true
  try {
    const ids = duePending.value.map((t) => t.id)
    await financeApi.transactions.confirmBatch(ids)
    pending.value = pending.value.filter((t) => !ids.includes(t.id))
    toast.success(`${ids.length} transações confirmadas`)
    emit('confirmed')
  } catch {
    toast.error('Erro ao confirmar transações')
  } finally {
    confirmingAll.value = false
  }
}
</script>

<template>
  <div v-if="!loading && pending.length > 0" class="bg-card rounded-lg p-4">
    <!-- Header: title and the batch action on one line, what comes in and goes out below -->
    <div class="flex items-center justify-between gap-3">
      <p class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        <Clock :size="14" class="text-warning shrink-0" />
        A confirmar
      </p>
      <button
        v-if="duePending.length > 1"
        type="button"
        class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold bg-primary text-primary-foreground whitespace-nowrap transition-all active:scale-[0.98] disabled:opacity-40"
        :disabled="confirmingAll"
        @click="confirmAll"
      >
        <Loader2 v-if="confirmingAll" :size="12" class="animate-spin" />
        <CheckCheck v-else :size="12" />
        Confirmar vencidas ({{ duePending.length }})
      </button>
    </div>
    <p class="text-[12px] text-muted-foreground tabular-nums mt-1 mb-1">
      {{ pending.length }} {{ pending.length === 1 ? 'item' : 'itens' }} até {{ weekEndLabel }}
      <template v-if="toReceive > 0"> · <span class="text-success font-medium">+{{ formatCurrency(toReceive) }} a receber</span></template>
      <template v-if="toPay > 0"> · <span class="text-destructive font-medium">−{{ formatCurrency(toPay) }} a pagar</span></template>
    </p>

    <!-- Rows -->
    <div>
      <div
        v-for="t in pending"
        :key="t.id"
        class="flex items-center gap-3 py-2.5 border-b border-border last:border-0 last:pb-0"
      >
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-medium text-foreground truncate">{{ t.description }}</p>
          <p
            class="text-[11px]"
            :class="dateLabel(t).overdue ? 'text-destructive font-medium' : 'text-muted-foreground'"
          >
            {{ dateLabel(t).text }}
            <template v-if="t.category"> · {{ t.category.name }}</template>
          </p>
        </div>
        <p
          class="text-[14px] font-semibold tabular-nums shrink-0"
          :class="t.type === 'income' ? 'text-success' : 'text-destructive'"
        >
          {{ t.type === 'income' ? '+' : '-' }}{{ formatCurrency(t.amount) }}
        </p>
        <button
          type="button"
          :aria-label="`Confirmar ${t.description}`"
          class="size-8 rounded-lg bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-40"
          :disabled="confirmingId === t.id || confirmingAll"
          @click="confirmOne(t)"
        >
          <Loader2 v-if="confirmingId === t.id" :size="14" class="animate-spin" />
          <Check v-else :size="14" />
        </button>
      </div>
    </div>
  </div>

  <ConfirmTransactionSheet v-model:open="confirmOpen" :transaction="confirmTarget" @confirmed="onConfirmed" />
</template>
