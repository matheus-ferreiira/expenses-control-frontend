<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AppPageContainer, ConfirmDialog, EmptyState } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import CreditCardCard from '@/features/finance/components/CreditCardCard.vue'
import CreditCardFormDialog from '@/features/finance/components/CreditCardFormDialog.vue'
import CardStatementSheet from '@/features/finance/components/CardStatementSheet.vue'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { Plus, CreditCard, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { getCardBillingPeriod } from '@/features/finance/utils/financeHelpers'
import { financeApi } from '@/services/api/finance'
import { toISODate } from '@/utils/date'
import type { CreditCard as CreditCardType, Transaction } from '@/types/finance'

const store = useFinanceStore()
const toast = useToast()

const formOpen = ref(false)
const editingCard = ref<CreditCardType | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)
const loading = ref(false)

// Statement sheet state
const statementOpen = ref(false)
const statementCard = ref<CreditCardType | null>(null)

function openStatement(card: CreditCardType) {
  statementCard.value = card
  statementOpen.value = true
}

// Archive / unarchive state
const archiveOpen = ref(false)
const archiveTarget = ref<CreditCardType | null>(null)
const archiving = ref(false)
const showArchived = ref(false)

/** All transactions from the last 60 days — covers any possible billing cycle */
const billingTransactions = ref<Transaction[]>([])

function openCreate() {
  editingCard.value = null
  formOpen.value = true
}

function openEdit(card: CreditCardType) {
  editingCard.value = card
  formOpen.value = true
}

function openDelete(id: string) {
  deletingId.value = id
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingId.value) return
  deleting.value = true
  try {
    await store.deleteCard(deletingId.value)
    toast.success('Cartão excluído')
    deleteOpen.value = false
    deletingId.value = null
  } catch {
    toast.error('Erro ao excluir cartão')
  } finally {
    deleting.value = false
  }
}

function requestArchive(card: CreditCardType) {
  archiveTarget.value = card
  archiveOpen.value = true
}

async function confirmArchive() {
  if (!archiveTarget.value) return
  archiving.value = true
  try {
    await store.updateCard(archiveTarget.value.id, { is_active: false })
    toast.success('Cartão arquivado')
    archiveOpen.value = false
    archiveTarget.value = null
  } catch {
    toast.error('Erro ao arquivar cartão')
  } finally {
    archiving.value = false
  }
}

async function unarchiveCard(card: CreditCardType) {
  try {
    await store.updateCard(card.id, { is_active: true })
    toast.success('Cartão reativado')
  } catch {
    toast.error('Erro ao reativar cartão')
  }
}

/**
 * Billing period for each card — computed from closing_day.
 * Result is a Map so we avoid recomputing per render.
 */
const billingPeriods = computed(() => {
  const map = new Map<string, ReturnType<typeof getCardBillingPeriod>>()
  for (const card of store.activeCards) {
    map.set(card.id, getCardBillingPeriod(card.closing_day, card.due_day))
  }
  return map
})

/**
 * Amount charged to a card in its current billing period.
 * Uses billingTransactions (60-day window) instead of the calendar-month store.transactions.
 */
function cardUsed(cardId: string): number {
  const period = billingPeriods.value.get(cardId)
  if (!period) return 0
  return billingTransactions.value
    .filter((t) =>
      t.card_id === cardId &&
      t.type === 'expense' &&
      t.transaction_date >= period.startDate &&
      t.transaction_date <= period.endDate,
    )
    .reduce((s, t) => s + t.amount, 0)
}

onMounted(async () => {
  loading.value = true
  try {
    await store.fetchCards()

    // Load 60 days of transactions — enough to cover any billing cycle
    // (billing period is at most 31 days, can span 2 calendar months)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 60)

    const result = await financeApi.transactions.list({
      start_date: toISODate(start),
      end_date: toISODate(end),
      per_page: 500,
    })
    billingTransactions.value = result.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 mb-1.5">
          Finanças
        </p>
        <div class="flex items-center gap-2 mb-1.5">
          <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none">
            Cartões
          </h1>
          <!-- Archived badge -->
          <span
            v-if="!loading && store.archivedCards.length > 0"
            class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground/60 border border-border/50"
          >
            {{ store.archivedCards.length }} arquivado{{ store.archivedCards.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <p class="text-[13px] text-muted-foreground/50">
          {{ store.activeCards.length }} cartã{{ store.activeCards.length !== 1 ? 'ões' : 'o' }} ativo{{ store.activeCards.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <Button size="sm" class="h-8 text-[12px] mt-1" @click="openCreate">
        <Plus :size="12" class="mr-1.5" />
        Novo cartão
      </Button>
    </div>

    <FinanceSubNav />

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <div v-for="i in 3" :key="i" class="rounded-lg border border-border/50 bg-card p-3.5 space-y-2.5">
        <div class="flex items-center gap-2.5">
          <Skeleton class="h-4 w-4 rounded shrink-0" />
          <div class="space-y-1.5 flex-1">
            <Skeleton class="h-3.5 w-20" />
            <Skeleton class="h-2.5 w-28" />
          </div>
        </div>
        <Skeleton class="h-5 w-28 mt-2" />
        <Skeleton class="h-1 w-full rounded-full" />
      </div>
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="store.cards.length === 0"
      :icon="CreditCard"
      title="Nenhum cartão cadastrado"
      description="Adicione seus cartões de crédito para acompanhar a fatura."
      cta-label="Novo cartão"
      @cta="openCreate"
    />

    <template v-else>
      <!-- Active cards grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <CreditCardCard
          v-for="card in store.activeCards"
          :key="card.id"
          :card="card"
          :used-amount="cardUsed(card.id)"
          :billing-period="billingPeriods.get(card.id)"
          @edit="openEdit"
          @delete="openDelete"
          @pay="openEdit"
          @archive="requestArchive"
          @unarchive="unarchiveCard"
          @statement="openStatement"
        />
      </div>

      <!-- Archived cards — collapsible -->
      <div v-if="store.archivedCards.length > 0" class="mt-6">
        <button
          type="button"
          class="flex items-center gap-2 text-[12px] font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-3"
          @click="showArchived = !showArchived"
        >
          <component :is="showArchived ? ChevronDown : ChevronRight" :size="14" />
          <span>{{ showArchived ? 'Ocultar' : 'Ver' }} cartões arquivados ({{ store.archivedCards.length }})</span>
        </button>
        <div v-if="showArchived" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <CreditCardCard
            v-for="card in store.archivedCards"
            :key="card.id"
            :card="card"
            :used-amount="0"
            @edit="openEdit"
            @delete="openDelete"
            @pay="openEdit"
            @archive="requestArchive"
            @unarchive="unarchiveCard"
          />
        </div>
      </div>
    </template>
  </AppPageContainer>

  <CreditCardFormDialog
    v-model:open="formOpen"
    :card="editingCard"
  />

  <!-- Card statement sheet -->
  <CardStatementSheet
    v-model:open="statementOpen"
    :card="statementCard"
    @select-transaction="() => {}"
  />

  <!-- Archive confirmation -->
  <ConfirmDialog
    v-model:open="archiveOpen"
    title="Arquivar cartão"
    :description="`'${archiveTarget?.name}' será ocultado da lista principal. O histórico de transações é mantido.`"
    confirm-label="Arquivar"
    :loading="archiving"
    @confirm="confirmArchive"
  />

  <!-- Delete confirmation -->
  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir cartão"
    description="Todos os dados deste cartão serão removidos permanentemente."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
