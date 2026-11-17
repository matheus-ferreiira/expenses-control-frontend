<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import BankReviewItemSheet from '@/features/finance/components/BankReviewItemSheet.vue'
import { AppPageContainer, EmptyState, PageHeader } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import { ArrowLeftRight, CalendarCheck, Check, CheckCheck, CreditCard, Inbox, Link2, Loader2, PlugZap, RefreshCw } from 'lucide-vue-next'
import { bankConnectionsApi } from '@/services/api/bankConnections'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { ROUTES } from '@/constants/routes'
import type { BankReviewAction, BankReviewDecision, BankReviewItem } from '@/types/bankConnections'

/**
 * "A lançar": o que o banco mostra e ainda não está no app. Cada item chega com uma sugestão (previsão,
 * escolha anterior, lançamentos parecidos); nada entra no app sem "Lançar".
 */
interface Row {
  item: BankReviewItem
  decision: BankReviewDecision
  selected: boolean
}

const store = useFinanceStore()
const toast = useToast()
const router = useRouter()

const rows = ref<Row[]>([])
const loading = ref(true)
const loadError = ref(false)
const applying = ref(false)

function decisionFrom(item: BankReviewItem): BankReviewDecision {
  const s = item.suggestion
  return {
    id: item.id,
    action: s.action,
    description: s.description ?? item.description,
    category_id: s.category_id,
    account_id: s.account_id,
    card_id: s.card_id,
    transaction_id: s.transaction_id,
    is_reimbursement: s.is_reimbursement,
    own_share_cents: s.own_share_cents,
  }
}

/** Ready to go without opening it: a known basis and nothing missing */
function ready(row: Row): boolean {
  const d = row.decision
  if (d.action === 'transfer') return !!d.account_id
  if (d.action === 'pay_card') return row.item.account.type === 'credit' ? !!d.account_id : !!d.card_id
  if (d.action === 'confirm' || d.action === 'match') return !!d.transaction_id
  return !!(d.description ?? '').trim()
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const result = await bankConnectionsApi.review()
    rows.value = result.items.map((item) => {
      const row: Row = { item, decision: decisionFrom(item), selected: false }
      row.selected = item.suggestion.source !== null && ready(row)
      return row
    })
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
  if (!store.categories.length) void store.fetchCategories()
  if (!store.accounts.length) void store.fetchAccounts()
  if (!store.cards.length) void store.fetchCards()
})

const selected = computed(() => rows.value.filter((r) => r.selected))
const allSelected = computed(() => rows.value.length > 0 && selected.value.length === rows.value.length)

const groups = computed(() => {
  const byDate = new Map<string, Row[]>()
  for (const row of rows.value) byDate.set(row.item.date, [...(byDate.get(row.item.date) ?? []), row])
  return [...byDate.entries()].map(([date, items]) => ({
    date,
    label: new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, ''),
    items,
  }))
})

const ACTION_LABELS: Record<BankReviewAction, string> = {
  expense: 'Despesa', income: 'Receita', transfer: 'Transferência', pay_card: 'Fatura do cartão',
  confirm: 'Confirma previsão', match: 'Já no app', ignore: 'Ignorar',
}
const ACTION_ICONS: Partial<Record<BankReviewAction, typeof Check>> = {
  transfer: ArrowLeftRight, pay_card: CreditCard, confirm: CalendarCheck, match: Link2,
}

function subtitle(row: Row): string {
  const d = row.decision
  const parts = [row.item.account.type === 'credit' ? `Cartão ${row.item.account.ledger_name ?? ''}`.trim() : row.item.account.ledger_name ?? row.item.account.name]
  if (d.action === 'expense' && row.item.account.type === 'credit') parts.push('Compra')
  else if (d.action === 'income' && d.is_reimbursement) parts.push('Reembolso')
  else parts.push(ACTION_LABELS[d.action])
  if (d.action === 'expense' && d.own_share_cents) parts.push(`dividida, minha parte ${formatCurrency(d.own_share_cents / 100)}`)
  const category = d.category_id ? store.categories.find((c) => c.id === d.category_id)?.name : null
  if (category) parts.push(category)
  if (d.action === 'transfer' && d.account_id) {
    const other = store.accounts.find((a) => a.id === d.account_id)?.name
    if (other) parts.push(row.item.direction === 'out' ? `para ${other}` : `de ${other}`)
  }
  if (row.item.total_installments) parts.push(`parcela ${row.item.installment_number}/${row.item.total_installments}`)
  return parts.join(' · ')
}

function title(row: Row): string {
  return row.decision.action === 'confirm' || row.decision.action === 'match' ? row.item.suggestion.description ?? row.item.description : row.decision.description || row.item.description
}

function toggleAll() {
  const value = !allSelected.value
  rows.value.forEach((r) => { r.selected = value && ready(r) })
}

// ── Editar um item ──────────────────────────────────────────────────────────
const sheetOpen = ref(false)
const editing = ref<Row | null>(null)

function edit(row: Row) {
  editing.value = row
  sheetOpen.value = true
}

function onSave(decision: BankReviewDecision) {
  const row = rows.value.find((r) => r.item.id === decision.id)
  if (row) {
    row.decision = decision
    row.selected = true
  }
}

async function onIgnore(id: string) {
  try {
    await bankConnectionsApi.applyReview([{ id, action: 'ignore' }])
    rows.value = rows.value.filter((r) => r.item.id !== id)
    toast.success('Ignorada', 'Dá para desfazer em Bancos conectados, na lista da conta.')
  } catch {
    toast.error('Não foi possível ignorar')
  }
}

// ── Lançar ──────────────────────────────────────────────────────────────────
async function apply() {
  if (!selected.value.length || applying.value) return
  applying.value = true
  try {
    const items = selected.value.map(({ decision: d }) => ({
      id: d.id,
      action: d.action,
      description: d.description,
      category_id: d.category_id,
      account_id: d.account_id,
      card_id: d.card_id,
      transaction_id: d.transaction_id,
      is_reimbursement: d.action === 'income' ? !!d.is_reimbursement : undefined,
      own_share_cents: d.action === 'expense' && d.own_share_cents ? d.own_share_cents : undefined,
    }))
    const result = await bankConnectionsApi.applyReview(items)
    if (result.applied) toast.success(`${result.applied} lançada${result.applied !== 1 ? 's' : ''} no app`)
    if (result.skipped.length) {
      toast.error(`${result.skipped.length} não ${result.skipped.length !== 1 ? 'foram lançadas' : 'foi lançada'}`, result.skipped[0]?.message)
    }
    // Keep the user's edits on what stayed; drop what was applied
    const skipped = new Set(result.skipped.map((s) => s.id))
    const kept = new Map(rows.value.filter((r) => skipped.has(r.item.id)).map((r) => [r.item.id, r]))
    await load()
    rows.value = rows.value.map((r) => kept.get(r.item.id) ?? r)
    void store.fetchAccounts()
  } catch {
    toast.error('Não foi possível lançar agora')
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />
    <PageHeader title="A lançar" subtitle="O que o banco mostra e ainda não está no app." compact-mobile />

    <div v-if="loading" class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0 bg-card rounded-lg p-4 space-y-3">
        <Skeleton class="h-2.5 w-16" />
        <Skeleton class="h-6 w-24" />
        <Skeleton class="h-11 w-full" />
      </div>
      <div class="bg-card rounded-lg overflow-hidden">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-3">
          <Skeleton class="size-5 rounded shrink-0" />
          <div class="flex-1 space-y-1.5">
            <Skeleton class="h-3 w-1/3" />
            <Skeleton class="h-2.5 w-1/2" />
          </div>
          <Skeleton class="h-3.5 w-16 shrink-0" />
        </div>
      </div>
    </div>

    <div v-else-if="loadError" class="bg-card rounded-lg">
      <EmptyState :icon="Inbox" title="Não foi possível carregar" description="Confira sua conexão e tente de novo." cta-label="Tentar de novo" :cta-icon="RefreshCw" @cta="load" />
    </div>

    <div v-else-if="!rows.length" class="bg-card rounded-lg">
      <EmptyState
        :icon="CheckCheck"
        title="Nada para lançar"
        description="Tudo o que o banco mostra das contas ligadas já está no app."
        cta-label="Bancos conectados"
        :cta-icon="PlugZap"
        @cta="router.push({ name: ROUTES.FINANCE_CONNECTIONS })"
      />
    </div>

    <div v-else class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <!-- Resumo + ação -->
      <div class="mb-4 lg:mb-0 lg:sticky lg:top-4">
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">A lançar</p>
            <button type="button" class="text-[11px] font-medium text-primary" @click="toggleAll">
              {{ allSelected ? 'Desmarcar todas' : 'Marcar as prontas' }}
            </button>
          </div>
          <p class="text-[20px] font-semibold tabular-nums leading-none">
            {{ rows.length }} <span class="text-[13px] font-normal text-muted-foreground">do banco · {{ selected.length }} marcada{{ selected.length !== 1 ? 's' : '' }}</span>
          </p>
          <button
            type="button"
            class="mt-4 w-full h-11 rounded-lg text-[14px] font-medium bg-primary text-primary-foreground disabled:opacity-40 inline-flex items-center justify-center gap-2"
            :disabled="!selected.length || applying"
            @click="apply"
          >
            <Loader2 v-if="applying" :size="15" class="animate-spin" />
            Lançar {{ selected.length }} marcada{{ selected.length !== 1 ? 's' : '' }}
          </button>
          <p class="text-[11px] text-muted-foreground leading-snug mt-3">
            As marcadas já vêm com sugestão: previsões a confirmar, suas escolhas anteriores e lançamentos parecidos.
            Toque num item para mudar. O que entrar fica com valor, data e conta travados; categoria pode mudar depois.
          </p>
        </div>
      </div>

      <!-- Lista por dia -->
      <div class="space-y-3">
        <section v-for="group in groups" :key="group.date" class="bg-card rounded-lg overflow-hidden">
          <p class="px-4 py-2.5 border-b border-border text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{{ group.label }}</p>
          <ul class="divide-y divide-border">
            <li v-for="row in group.items" :key="row.item.id" class="flex items-center gap-3 pl-2 pr-4 py-1">
              <button
                type="button"
                role="checkbox"
                :aria-checked="row.selected"
                :aria-label="`Marcar ${title(row)}`"
                class="flex items-center justify-center size-10 shrink-0"
                @click="row.selected = !row.selected"
              >
                <span
                  class="flex items-center justify-center size-5 rounded-md transition-colors"
                  :class="row.selected ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                >
                  <Check v-if="row.selected" :size="13" :stroke-width="3" />
                </span>
              </button>
              <button type="button" class="flex-1 min-w-0 flex items-center gap-3 py-2 text-left" @click="edit(row)">
                <span class="flex-1 min-w-0">
                  <span class="flex items-center gap-1.5 min-w-0">
                    <component :is="ACTION_ICONS[row.decision.action]" v-if="ACTION_ICONS[row.decision.action]" :size="13" class="text-muted-foreground shrink-0" />
                    <span class="text-[14px] font-medium truncate">{{ title(row) }}</span>
                  </span>
                  <span class="block text-[12px] text-muted-foreground truncate mt-0.5">{{ subtitle(row) }}</span>
                  <span class="block text-[11px] text-muted-foreground/80 truncate">{{ row.item.description }}</span>
                </span>
                <span
                  class="text-[14px] font-semibold tabular-nums whitespace-nowrap shrink-0"
                  :class="row.item.direction === 'in' ? 'text-success' : 'text-foreground'"
                >{{ row.item.direction === 'in' ? '+' : '−' }}{{ formatCurrency(row.item.amount_cents / 100) }}</span>
              </button>
            </li>
          </ul>
        </section>

        <button
          type="button"
          class="w-full h-11 rounded-lg text-[14px] font-medium bg-primary text-primary-foreground disabled:opacity-40 inline-flex items-center justify-center gap-2"
          :disabled="!selected.length || applying"
          @click="apply"
        >
          <Loader2 v-if="applying" :size="15" class="animate-spin" />
          Lançar {{ selected.length }} marcada{{ selected.length !== 1 ? 's' : '' }}
        </button>
      </div>
    </div>
  </AppPageContainer>

  <BankReviewItemSheet
    v-model:open="sheetOpen"
    :item="editing?.item ?? null"
    :decision="editing?.decision ?? null"
    @save="onSave"
    @ignore="onIgnore"
  />
</template>
