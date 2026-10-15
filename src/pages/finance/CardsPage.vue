<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { AppBreadcrumbs } from '@/components/shared'
import { onMounted, ref } from 'vue'
import { AppPageContainer, ConfirmDialog, EmptyState } from '@/components/shared'
import CreditCardCard from '@/features/finance/components/CreditCardCard.vue'
import CreditCardFormDialog from '@/features/finance/components/CreditCardFormDialog.vue'
import CardStatementSheet from '@/features/finance/components/CardStatementSheet.vue'
import { Skeleton } from '@ui/skeleton'
import { Plus, CreditCard, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { financeApi } from '@/services/api/finance'
import type { CardOverview, CreditCard as CreditCardType } from '@/types/finance'

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
const statementCycle = ref<string | null>(null)

function openStatement(card: CreditCardType, cycle?: string) {
  statementCard.value = card
  statementCycle.value = cycle ?? null
  statementOpen.value = true
}

/** Resumo de cada cartão ativo, calculado no backend (faturas, compromissos e limite real). */
const overviews = ref<Record<string, CardOverview>>({})
const loadingOverviews = ref(false)

async function loadOverviews() {
  loadingOverviews.value = true
  try {
    const entries = await Promise.all(
      store.activeCards.map(async (card) => [card.id, await financeApi.cards.overview(card.id)] as const),
    )
    overviews.value = Object.fromEntries(entries)
  } catch {
    toast.error('Erro ao carregar as faturas dos cartões')
  } finally {
    loadingOverviews.value = false
  }
}

// Archive / unarchive state
const archiveOpen = ref(false)
const archiveTarget = ref<CreditCardType | null>(null)
const archiving = ref(false)
const showArchived = ref(false)

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

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([store.fetchCards(), store.activeAccounts.length ? Promise.resolve() : store.fetchAccounts()])
  } finally {
    loading.value = false
  }
  await loadOverviews()
})
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <AppBreadcrumbs />
        <div class="flex items-center gap-2 mb-1.5">
          <h1 class="text-[22px] lg:text-[18px] font-semibold tracking-tight text-foreground leading-none">
            Cartões
          </h1>
          <!-- Archived badge -->
          <span
            v-if="!loading && store.archivedCards.length > 0"
            class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground "
          >
            {{ store.archivedCards.length }} arquivado{{ store.archivedCards.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <p class="text-[12px] text-muted-foreground">
          {{ store.activeCards.length }} cart{{ store.activeCards.length !== 1 ? 'ões' : 'ão' }} ativo{{ store.activeCards.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors mt-1"
        @click="openCreate"
      >
        <Plus :size="14" />
        Novo cartão
      </button>
    </div>



    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 gap-3">
      <div v-for="i in 3" :key="i" class="rounded-lg bg-card p-3.5 space-y-2.5">
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
      <div class="grid grid-cols-1 gap-3">
        <CreditCardCard
          v-for="card in store.activeCards"
          :key="card.id"
          :card="card"
          :overview="overviews[card.id] ?? null"
          :loading="loadingOverviews"
          @edit="openEdit"
          @delete="openDelete"
          @archive="requestArchive"
          @unarchive="unarchiveCard"
          @statement="openStatement"
        />
      </div>

      <!-- Archived cards — collapsible -->
      <div v-if="store.archivedCards.length > 0" class="mt-6">
        <button
          type="button"
          class="flex items-center gap-2 text-[12px] font-medium text-muted-foreground hover:text-muted-foreground transition-colors mb-3"
          @click="showArchived = !showArchived"
        >
          <component :is="showArchived ? ChevronDown : ChevronRight" :size="14" />
          <span>{{ showArchived ? 'Ocultar' : 'Ver' }} cartões arquivados ({{ store.archivedCards.length }})</span>
        </button>
        <div v-if="showArchived" class="grid grid-cols-1 gap-3">
          <CreditCardCard
            v-for="card in store.archivedCards"
            :key="card.id"
            :card="card"
            @edit="openEdit"
            @delete="openDelete"
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
    :initial-cycle="statementCycle"
    @paid="loadOverviews"
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
