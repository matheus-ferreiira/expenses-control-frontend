<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Skeleton } from '@ui/skeleton'
import { ChevronLeft, ChevronRight, X, Receipt, Loader2 } from 'lucide-vue-next'
import type { CardStatementDetail, CreditCard, Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { toISODate } from '@/utils/date'
import { addMonths, cycleLabel, groupTransactionsByDate, statementPeriodLabel, statementStatusInfo } from '../utils/financeHelpers'
import { financeApi } from '@/services/api/finance'
import TransactionCard from './TransactionCard.vue'
import { useToast } from '@/composables/useToast'
import { useFinanceStore } from '@/stores/finance'

const props = defineProps<{
  open: boolean
  card: CreditCard | null
  /** Fatura (YYYY-MM, mês de vencimento) a abrir. Sem valor: a fatura a pagar ou a aberta. */
  initialCycle?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  selectTransaction: [transaction: Transaction]
  paid: [payment: Transaction]
}>()

const toast = useToast()
const store = useFinanceStore()

const cycle = ref('')
const statement = ref<CardStatementDetail | null>(null)
const loading = ref(false)
const payPanelOpen = ref(false)
let loadVersion = 0

async function resolveInitialCycle(card: CreditCard): Promise<string> {
  if (props.initialCycle) return props.initialCycle
  try {
    const overview = await financeApi.cards.overview(card.id)
    return overview.to_pay[0]?.cycle ?? overview.open_cycle
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
}

async function loadStatement() {
  if (!props.card || !cycle.value) return
  const version = ++loadVersion
  loading.value = true
  statement.value = null
  payPanelOpen.value = false
  try {
    const result = await financeApi.cards.statement(props.card.id, cycle.value)
    if (version === loadVersion) statement.value = result
  } catch {
    if (version === loadVersion) toast.error('Erro ao carregar a fatura')
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

watch(
  () => [props.open, props.card?.id, props.initialCycle] as const,
  async ([isOpen]) => {
    if (!isOpen || !props.card) {
      payPanelOpen.value = false
      return
    }
    cycle.value = await resolveInitialCycle(props.card)
    await loadStatement()
  },
  { immediate: true },
)

function prevCycle() { cycle.value = addMonths(cycle.value, -1); loadStatement() }
function nextCycle() { cycle.value = addMonths(cycle.value, 1); loadStatement() }

const statusInfo = computed(() => (statement.value ? statementStatusInfo(statement.value) : null))
const statusClass = computed(() => {
  const tone = statusInfo.value?.tone
  if (tone === 'danger') return 'text-destructive'
  if (tone === 'warn') return 'text-warning'
  if (tone === 'ok') return 'text-success'
  return 'text-muted-foreground'
})
const canPay = computed(() => !!statement.value && !statement.value.historical && statement.value.remaining_cents > 0)
const groups = computed(() => groupTransactionsByDate(statement.value?.transactions ?? []))
const money = (cents: number) => formatCurrency(cents / 100)

// ── Pagamento ─────────────────────────────────────────────────────────────────
const payAccountId = ref('')
const payAmount = ref('')
const payDate = ref(toISODate(new Date()))
const paymentReference = ref('')
const paying = ref(false)
const todayStr = toISODate(new Date())

function openPayPanel() {
  paymentReference.value = crypto.randomUUID()
  payAmount.value = ((statement.value?.remaining_cents ?? 0) / 100).toFixed(2).replace('.', ',')
  payDate.value = todayStr
  if (!store.activeAccounts.length) store.fetchAccounts()
  payAccountId.value = props.card?.bank_account_id && store.activeAccounts.some((a) => a.id === props.card?.bank_account_id)
    ? props.card.bank_account_id
    : store.activeAccounts[0]?.id ?? ''
  payPanelOpen.value = true
}

const payAmountParsed = computed(() => {
  const v = parseFloat(payAmount.value.replace(/\./g, '').replace(',', '.'))
  return isNaN(v) ? 0 : v
})
const payValid = computed(() => !!payAccountId.value && payAmountParsed.value > 0 && !!payDate.value && payDate.value <= todayStr)

async function submitPayment() {
  if (!props.card || !payValid.value || paying.value) return
  paying.value = true
  try {
    const paid = await financeApi.cards.payStatement(props.card.id, {
      account_id: payAccountId.value,
      amount: payAmountParsed.value,
      statement_month: cycle.value,
      payment_date: payDate.value,
      payment_reference: paymentReference.value,
    })
    toast.success('Pagamento registrado')
    await loadStatement()
    emit('paid', paid)
    store.fetchAccounts()
  } catch {
    toast.error('Erro ao registrar o pagamento')
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border shrink-0" />

      <template v-if="card">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <span
            class="flex items-center justify-center size-9 rounded-xl font-bold text-[11px] text-foreground shrink-0"
            :style="{ background: card.color || '#6b7280' }"
          >
            {{ card.name.substring(0, 2).toUpperCase() }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-semibold leading-none truncate">{{ card.name }}</p>
            <p class="text-[12px] text-muted-foreground mt-1">Fatura de {{ cycleLabel(cycle || '2026-01') }}</p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            class="size-9 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            @click="emit('update:open', false)"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Navegação entre faturas -->
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <button type="button" aria-label="Fatura anterior" class="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-muted text-muted-foreground" @click="prevCycle">
            <ChevronLeft :size="18" />
          </button>
          <div class="text-center">
            <p class="text-[13px] font-semibold">{{ statement ? statementPeriodLabel(statement) : '—' }}</p>
            <p v-if="statusInfo" class="text-[12px] font-medium mt-0.5" :class="statusClass">{{ statusInfo.label }}</p>
          </div>
          <button type="button" aria-label="Próxima fatura" class="min-h-[44px] min-w-[44px] grid place-items-center rounded-lg hover:bg-muted text-muted-foreground" @click="nextCycle">
            <ChevronRight :size="18" />
          </button>
        </div>

        <!-- Resumo -->
        <div class="px-4 py-3 border-b border-border shrink-0">
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-32" />
            <Skeleton class="h-4 w-48" />
          </div>
          <template v-else-if="statement">
            <p class="text-[12px] text-muted-foreground">Total da fatura</p>
            <p class="text-2xl font-bold tabular-nums text-foreground">{{ money(statement.charges_cents) }}</p>
            <div class="mt-2 grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <p class="text-muted-foreground">Pago</p>
                <p class="font-semibold tabular-nums text-foreground">{{ statement.historical ? 'Quitada na renegociação' : money(statement.paid_cents) }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">Falta pagar</p>
                <p class="font-semibold tabular-nums" :class="statement.remaining_cents > 0 ? 'text-warning' : 'text-success'">{{ money(statement.remaining_cents) }}</p>
              </div>
            </div>
            <p v-if="statement.difference_cents" class="mt-2 text-[12px] text-warning">
              Diferença entre o CSV e o app do banco: {{ money(statement.difference_cents) }} (pendente de conciliação).
            </p>
            <p v-if="statement.payments.length" class="mt-2 text-[12px] text-muted-foreground">
              Pagamentos:
              <template v-for="(p, i) in statement.payments" :key="p.id">
                {{ i ? ' · ' : '' }}{{ formatCurrency(p.amount) }} em {{ p.transaction_date.split('-').reverse().slice(0, 2).join('/') }}<template v-if="p.account"> ({{ p.account.name }})</template>
              </template>
            </p>

            <!-- Pagar fatura -->
            <template v-if="canPay">
              <button
                v-if="!payPanelOpen"
                type="button"
                class="w-full mt-3 h-11 rounded-lg bg-primary text-primary-foreground text-[14px] font-semibold active:scale-[0.98]"
                @click="openPayPanel"
              >
                Registrar pagamento
              </button>
              <div v-else class="mt-3 bg-card rounded-lg p-3 space-y-3">
                <div>
                  <p class="text-[12px] font-medium text-muted-foreground mb-1.5">Pago com</p>
                  <div class="space-y-1">
                    <button
                      v-for="acc in store.activeAccounts"
                      :key="acc.id"
                      type="button"
                      class="w-full flex items-center justify-between gap-3 px-3 h-11 rounded-lg text-[13px] transition-colors"
                      :class="payAccountId === acc.id ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground hover:text-foreground'"
                      @click="payAccountId = acc.id"
                    >
                      <span class="truncate">{{ acc.name }}</span>
                      <span class="tabular-nums shrink-0">{{ formatCurrency(acc.balance) }}</span>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <label class="block">
                    <span class="text-[12px] font-medium text-muted-foreground">Valor (R$)</span>
                    <input v-model="payAmount" type="text" inputmode="decimal" class="mt-1 w-full h-11 px-3 rounded-lg bg-muted text-[14px] text-foreground outline-none tabular-nums" />
                  </label>
                  <label class="block">
                    <span class="text-[12px] font-medium text-muted-foreground">Data do pagamento</span>
                    <input v-model="payDate" type="date" :max="todayStr" class="mt-1 w-full h-11 px-3 rounded-lg bg-muted text-[14px] text-foreground outline-none" />
                  </label>
                </div>
                <div class="flex gap-2">
                  <button type="button" class="flex-1 h-11 rounded-lg text-[13px] bg-muted text-muted-foreground" :disabled="paying" @click="payPanelOpen = false">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="flex-1 h-11 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-40"
                    :disabled="!payValid || paying"
                    @click="submitPayment"
                  >
                    <Loader2 v-if="paying" :size="14" class="animate-spin" />
                    Confirmar pagamento
                  </button>
                </div>
              </div>
            </template>
          </template>
        </div>

        <!-- Lançamentos -->
        <div class="flex-1 overflow-y-auto">
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
          <div v-else-if="!statement?.transactions.length" class="flex flex-col items-center justify-center py-12 text-center px-4">
            <Receipt :size="32" class="text-muted-foreground mb-3" />
            <p class="text-[14px] font-semibold">Nenhuma compra nesta fatura</p>
          </div>
          <div v-else>
            <template v-for="group in groups" :key="group.date">
              <div class="sticky top-0 z-10 bg-background px-4 pt-2.5 pb-1 flex items-center justify-between gap-2">
                <span class="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{{ group.label }}</span>
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
