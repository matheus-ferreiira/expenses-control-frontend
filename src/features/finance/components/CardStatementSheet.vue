<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Skeleton } from '@ui/skeleton'
import { ChevronLeft, ChevronRight, X, Receipt, CheckCircle2, Loader2 } from 'lucide-vue-next'
import type { CreditCard, Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { groupTransactionsByDate, getCardBillingPeriod, utilizationPercent } from '../utils/financeHelpers'
import { financeApi } from '@/services/api/finance'
import TransactionCard from './TransactionCard.vue'
import { useToast } from '@/composables/useToast'
import { useFinanceStore } from '@/stores/finance'

const props = defineProps<{
  open: boolean
  card: CreditCard | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  selectTransaction: [transaction: Transaction]
  paid: [payment: Transaction]
}>()

const toast = useToast()
const store = useFinanceStore()

// ── Billing cycle navigation ────────────────────────────────────────────────

/**
 * referenceOffset controls which billing cycle we're viewing.
 * 0 = current cycle, -1 = previous, -2 = two months back, etc.
 */
const referenceOffset = ref(0)

/** Compute a reference date shifted by the offset (in months, based on billing day). */
const referenceDate = computed(() => {
  if (!props.card) return new Date()
  const d = new Date()
  d.setMonth(d.getMonth() + referenceOffset.value)
  return d
})

const billingPeriod = computed(() => {
  if (!props.card) return null
  return getCardBillingPeriod(props.card.closing_day, props.card.due_day, referenceDate.value)
})

// ── Transactions ─────────────────────────────────────────────────────────────

const transactions = ref<Transaction[]>([])
const loading = ref(false)

async function loadTransactions() {
  if (!props.card || !billingPeriod.value) return
  loading.value = true
  transactions.value = []
  try {
    const result = await financeApi.transactions.list({
      card_id: props.card.id,
      start_date: billingPeriod.value.startDate,
      end_date: billingPeriod.value.endDate,
      per_page: 200,
    })
    transactions.value = result.data
  } catch {
    transactions.value = []
    toast.error('Erro ao carregar extrato')
  } finally {
    loading.value = false
  }
  loadPayment()
}

// ── Statement payment ─────────────────────────────────────────────────────────

/** "YYYY-MM" do fechamento do ciclo em exibição — identifica a fatura */
const statementMonth = computed(() => billingPeriod.value?.endDate.slice(0, 7) ?? '')

const payment = ref<Transaction | null>(null)
const payPanelOpen = ref(false)
const payAccountId = ref('')
const payAmount = ref('')
const paying = ref(false)

async function loadPayment() {
  if (!props.card || !statementMonth.value) return
  try {
    payment.value = await financeApi.cards.getStatementPayment(props.card.id, statementMonth.value)
  } catch {
    payment.value = null
  }
}

function openPayPanel() {
  payAmount.value = totalUsed.value.toFixed(2).replace('.', ',')
  if (!store.activeAccounts.length) store.fetchAccounts()
  payAccountId.value = store.activeAccounts[0]?.id ?? ''
  payPanelOpen.value = true
}

const payAmountParsed = computed(() => {
  const v = parseFloat(payAmount.value.replace(/\./g, '').replace(',', '.'))
  return isNaN(v) ? 0 : v
})

async function submitPayment() {
  if (!props.card || !payAccountId.value || payAmountParsed.value <= 0 || paying.value) return
  paying.value = true
  try {
    const paid = await financeApi.cards.payStatement(props.card.id, {
      account_id: payAccountId.value,
      amount: payAmountParsed.value,
      statement_month: statementMonth.value,
    })
    payment.value = paid
    payPanelOpen.value = false
    toast.success('Fatura paga')
    emit('paid', paid)
    store.fetchAccounts()
  } catch {
    toast.error('Erro ao pagar fatura')
  } finally {
    paying.value = false
  }
}

watch(
  [() => props.open, () => props.card, referenceOffset],
  ([isOpen]) => {
    if (isOpen && props.card) {
      loadTransactions()
    }
  },
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      // Reset to current cycle when closing
      referenceOffset.value = 0
      payPanelOpen.value = false
      payment.value = null
    }
  },
)

// ── Computed ──────────────────────────────────────────────────────────────────

const totalUsed = computed(() =>
  transactions.value
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0),
)

const utilPct = computed(() =>
  props.card ? utilizationPercent(totalUsed.value, props.card.limit_amount) : 0,
)

const limitBarClass = computed(() => {
  if (utilPct.value < 50) return 'bg-success'
  if (utilPct.value < 76) return 'bg-warning'
  return 'bg-destructive'
})

const groups = computed(() => groupTransactionsByDate(transactions.value))

function prevCycle() { referenceOffset.value-- }
function nextCycle() { if (referenceOffset.value < 0) referenceOffset.value++ }
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border shrink-0" />

      <template v-if="card">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <!-- Card avatar -->
          <span
            class="flex items-center justify-center size-9 rounded-xl font-bold text-[11px] text-foreground shrink-0"
            :style="{ background: card.color || '#6b7280' }"
          >
            {{ card.name.substring(0, 2).toUpperCase() }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-semibold leading-none truncate">{{ card.name }}</p>
            <p v-if="billingPeriod" class="text-[11px] text-muted-foreground mt-0.5">
              {{ billingPeriod.label }}
            </p>
          </div>
          <button
            type="button"
            class="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            @click="emit('update:open', false)"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Cycle navigator -->
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            @click="prevCycle"
          >
            <ChevronLeft :size="18" />
          </button>
          <div class="text-center">
            <p class="text-[13px] font-semibold">
              {{ billingPeriod?.label ?? '—' }}
            </p>
            <p v-if="referenceOffset < 0 && billingPeriod" class="text-[10px] text-muted-foreground mt-0.5">
              Fatura fechada · Venceu {{ new Date(billingPeriod.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) }}
            </p>
            <p v-else class="text-[10px] text-success mt-0.5">
              Fatura aberta
            </p>
          </div>
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            :class="referenceOffset >= 0 ? 'opacity-30 pointer-events-none' : ''"
            @click="nextCycle"
          >
            <ChevronRight :size="18" />
          </button>
        </div>

        <!-- Invoice summary -->
        <div class="px-4 py-3 border-b border-border shrink-0">
          <div class="flex items-end justify-between mb-2">
            <div>
              <p class="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                Total da fatura
              </p>
              <p class="text-2xl font-bold tabular-nums text-destructive">
                {{ formatCurrency(totalUsed) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-muted-foreground">{{ utilPct }}% do limite</p>
              <p class="text-[12px] tabular-nums text-muted-foreground mt-0.5">
                de {{ formatCurrency(card.limit_amount) }}
              </p>
            </div>
          </div>
          <!-- Utilization bar -->
          <div class="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="limitBarClass"
              :style="{ width: `${utilPct}%` }"
            />
          </div>

          <!-- Fatura paga -->
          <div
            v-if="payment"
            class="mt-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium bg-muted text-success"
          >
            <CheckCircle2 :size="14" class="shrink-0" />
            <span class="leading-snug flex-1">
              Fatura paga · {{ formatCurrency(payment.amount) }}
              <template v-if="payment.account"> · {{ payment.account.name }}</template>
            </span>
          </div>

          <!-- Pagar fatura -->
          <template v-else-if="totalUsed > 0">
            <button
              v-if="!payPanelOpen"
              type="button"
              class="w-full mt-3 h-10 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold transition-all active:scale-[0.98]"
              @click="openPayPanel"
            >
              Pagar fatura
            </button>

            <!-- Painel de pagamento -->
            <div v-else class="mt-3 bg-muted rounded-lg p-3 space-y-3">
              <div>
                <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                  Pagar com
                </p>
                <div class="space-y-1">
                  <button
                    v-for="acc in store.activeAccounts"
                    :key="acc.id"
                    type="button"
                    class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors"
                    :class="payAccountId === acc.id
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-card text-muted-foreground hover:text-foreground'"
                    @click="payAccountId = acc.id"
                  >
                    <span class="truncate">{{ acc.name }}</span>
                    <span class="tabular-nums font-semibold shrink-0">{{ formatCurrency(acc.balance) }}</span>
                  </button>
                </div>
              </div>

              <div>
                <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                  Valor (R$)
                </p>
                <div class="flex items-center gap-2 h-10 px-3 rounded-lg bg-card transition-colors">
                  <span class="text-[12px] text-muted-foreground shrink-0">R$</span>
                  <input
                    v-model="payAmount"
                    type="text"
                    inputmode="numeric"
                    class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 h-10 rounded-lg text-[13px] bg-card text-muted-foreground transition-colors hover:text-foreground"
                  :disabled="paying"
                  @click="payPanelOpen = false"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="flex-1 h-10 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="!payAccountId || payAmountParsed <= 0 || paying"
                  @click="submitPayment"
                >
                  <Loader2 v-if="paying" :size="14" class="animate-spin" />
                  Confirmar pagamento
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Transactions list -->
        <div class="flex-1 overflow-y-auto">
          <!-- Loading -->
          <div v-if="loading" class="p-4 space-y-3">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3">
              <Skeleton class="size-10 rounded-xl shrink-0" />
              <div class="flex-1 space-y-1.5">
                <Skeleton class="h-3 w-1/2" />
                <Skeleton class="h-2.5 w-1/4" />
              </div>
              <Skeleton class="h-3.5 w-20 shrink-0" />
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="transactions.length === 0"
            class="flex flex-col items-center justify-center py-12 text-center px-4"
          >
            <Receipt :size="32" class="text-muted-foreground mb-3" />
            <p class="text-[14px] font-semibold">Nenhuma transação</p>
            <p class="text-[12px] text-muted-foreground mt-1">
              Nenhuma despesa neste período de fatura.
            </p>
          </div>

          <!-- Grouped transactions -->
          <div v-else>
            <template v-for="group in groups" :key="group.date">
              <!-- Date header -->
              <div class="sticky top-0 z-10 bg-background backdrop-blur px-4 pt-2.5 pb-1 flex items-center justify-between gap-2">
                <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {{ group.label }}
                </span>
                <span
                  v-if="group.expenses > 0"
                  class="text-[10px] tabular-nums text-destructive"
                >
                  -{{ formatCurrency(group.expenses) }}
                </span>
              </div>
              <ul class="divide-y divide-border">
                <TransactionCard
                  v-for="t in group.transactions"
                  :key="t.id"
                  :transaction="t"
                  @select="emit('selectTransaction', $event)"
                />
              </ul>
            </template>
          </div>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
