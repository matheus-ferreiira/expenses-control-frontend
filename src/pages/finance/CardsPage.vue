<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AppPageContainer, ConfirmDialog } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import CreditCardCard from '@/features/finance/components/CreditCardCard.vue'
import CreditCardFormDialog from '@/features/finance/components/CreditCardFormDialog.vue'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { Plus, CreditCard } from 'lucide-vue-next'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import type { CreditCard as CreditCardType } from '@/types/finance'

const store = useFinanceStore()
const toast = useToast()

const formOpen = ref(false)
const editingCard = ref<CreditCardType | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)
const loading = ref(false)

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

/** Card usage = current month's expense transactions with that card_id */
function cardUsed(cardId: string): number {
  return store.transactions
    .filter((t) => t.card_id === cardId && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
}

const currentMonth = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      store.fetchCards(),
      store.fetchTransactions({
        start_date: `${currentMonth.value}-01`,
        end_date: `${currentMonth.value}-31`,
        per_page: 500,
      }),
    ])
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
        <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Cartões
        </h1>
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
    <div
      v-else-if="store.cards.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <div class="p-3 rounded-lg bg-muted mb-3">
        <CreditCard :size="22" class="text-muted-foreground" />
      </div>
      <p class="text-sm font-medium text-foreground">Nenhum cartão cadastrado</p>
      <p class="text-xs text-muted-foreground mt-0.5 mb-4">
        Adicione seus cartões de crédito para acompanhar a fatura.
      </p>
      <Button size="sm" @click="openCreate">
        <Plus :size="14" class="mr-1.5" />
        Novo cartão
      </Button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <CreditCardCard
        v-for="card in store.activeCards"
        :key="card.id"
        :card="card"
        :used-amount="cardUsed(card.id)"
        @edit="openEdit"
        @delete="openDelete"
        @pay="openEdit"
      />
    </div>
  </AppPageContainer>

  <CreditCardFormDialog
    v-model:open="formOpen"
    :card="editingCard"
  />

  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir cartão"
    description="Todos os dados deste cartão serão removidos."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
