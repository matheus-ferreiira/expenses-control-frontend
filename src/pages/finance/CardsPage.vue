<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { onMounted, ref } from 'vue'
import { AppPageContainer, ConfirmDialog, EmptyState, PageHeader } from '@/components/shared'
import CreditCardCard from '@/features/finance/components/CreditCardCard.vue'
import CreditCardFormDialog from '@/features/finance/components/CreditCardFormDialog.vue'
import CardStatementSheet from '@/features/finance/components/CardStatementSheet.vue'
import { Skeleton } from '@ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Plus, CreditCard, ChevronRight, Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
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
  } catch (e: unknown) {
    // A card with purchases or payments is archived instead (D-25): show why
    const data = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data
    toast.error(data?.errors?.card?.[0] ?? data?.message ?? 'Erro ao excluir cartão')
    deleteOpen.value = false
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
    <PageHeader title="Cartões" subtitle="Fatura a pagar, fatura aberta e limite de cada cartão." compact-mobile>
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
          @click="openCreate"
        >
          <Plus class="size-3.5" />
          Novo cartão
        </button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 xl:gap-6 lg:items-start">
      <div v-for="i in 2" :key="i" class="rounded-lg bg-card p-4 space-y-3">
        <div class="flex items-center gap-2.5">
          <Skeleton class="size-9 rounded-lg shrink-0" />
          <div class="space-y-1.5 flex-1">
            <Skeleton class="h-3.5 w-20" />
            <Skeleton class="h-2.5 w-28" />
          </div>
        </div>
        <Skeleton class="h-16 w-full rounded-md" />
        <Skeleton class="h-1.5 w-full rounded-full" />
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
      <!-- Desktop: two columns, each card as wide as a Visão Geral column -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 xl:gap-6 lg:items-start">
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

      <!-- Archived cards: collapsed block with one muted row each, like archived accounts -->
      <section
        v-if="store.archivedCards.length > 0"
        class="mt-3 lg:mt-5 bg-card rounded-lg overflow-hidden lg:w-[calc(50%-0.625rem)] xl:w-[calc(50%-0.75rem)]"
      >
        <button
          type="button"
          class="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          :aria-expanded="showArchived"
          @click="showArchived = !showArchived"
        >
          <ChevronRight :size="14" class="text-muted-foreground shrink-0 transition-transform" :class="showArchived ? 'rotate-90' : ''" />
          <Archive :size="14" class="text-muted-foreground shrink-0" />
          <span class="text-[13px] font-medium text-foreground">Arquivados ({{ store.archivedCards.length }})</span>
        </button>
        <ul v-if="showArchived" class="border-t border-border divide-y divide-border">
          <li v-for="card in store.archivedCards" :key="card.id" class="flex items-center gap-3 pl-4 pr-1 py-2.5">
            <span class="size-8 rounded-lg grid place-items-center shrink-0 bg-muted text-[11px] font-semibold text-muted-foreground">
              {{ card.name.substring(0, 2).toUpperCase() }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-muted-foreground truncate">{{ card.name }}</p>
              <p class="text-[12px] text-muted-foreground mt-0.5">Fecha dia {{ card.closing_day }} · Vence dia {{ card.due_day }}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  :aria-label="`Opções do cartão ${card.name}`"
                  class="size-10 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                >
                  <MoreHorizontal :size="15" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-40">
                <DropdownMenuItem @click="unarchiveCard(card)">
                  <ArchiveRestore :size="12" class="mr-2" />
                  Desarquivar
                </DropdownMenuItem>
                <DropdownMenuItem @click="openEdit(card)">
                  <Pencil :size="12" class="mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDelete(card.id)">
                  <Trash2 :size="12" class="mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </section>
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
    description="O cartão será excluído. Cartões com compras ou pagamentos não podem ser excluídos: arquive-os para escondê-los mantendo o histórico."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
