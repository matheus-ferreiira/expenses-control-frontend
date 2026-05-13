<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AppPageContainer, PageHeader, ConfirmDialog } from '@/components/shared'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import AccountCard from '@/features/finance/components/AccountCard.vue'
import AccountFormDialog from '@/features/finance/components/AccountFormDialog.vue'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { Plus, Landmark } from 'lucide-vue-next'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import type { BankAccount } from '@/types/finance'

const store = useFinanceStore()
const toast = useToast()

const formOpen = ref(false)
const editingAccount = ref<BankAccount | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)
const loading = ref(false)

const totalBalance = computed(() =>
  store.activeAccounts.reduce((s, a) => s + a.balance, 0),
)

function openCreate() {
  editingAccount.value = null
  formOpen.value = true
}

function openEdit(account: BankAccount) {
  editingAccount.value = account
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
    await store.deleteAccount(deletingId.value)
    toast.success('Conta excluída')
    deleteOpen.value = false
    deletingId.value = null
  } catch {
    toast.error('Erro ao excluir conta')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await store.fetchAccounts()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppPageContainer>
    <PageHeader title="Contas">
      <template #actions>
        <span v-if="!loading" class="text-xs text-muted-foreground hidden sm:inline">
          Total: {{ formatCurrency(totalBalance) }}
        </span>
        <Button size="sm" class="h-8 gap-1.5" @click="openCreate">
          <Plus :size="14" />
          Nova conta
        </Button>
      </template>
    </PageHeader>

    <FinanceSubNav />

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="rounded-lg border border-border bg-card p-4 space-y-3">
        <div class="flex items-center gap-3">
          <Skeleton class="h-9 w-9 rounded-lg" />
          <div class="space-y-1.5">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-3 w-16" />
          </div>
        </div>
        <Skeleton class="h-6 w-28" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="store.accounts.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <div class="p-3 rounded-lg bg-muted mb-3">
        <Landmark :size="22" class="text-muted-foreground" />
      </div>
      <p class="text-sm font-medium text-foreground">Nenhuma conta cadastrada</p>
      <p class="text-xs text-muted-foreground mt-0.5 mb-4">
        Adicione suas contas bancárias para acompanhar seu saldo.
      </p>
      <Button size="sm" @click="openCreate">
        <Plus :size="14" class="mr-1.5" />
        Nova conta
      </Button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AccountCard
        v-for="account in store.activeAccounts"
        :key="account.id"
        :account="account"
        @edit="openEdit"
        @delete="openDelete"
      />
    </div>
  </AppPageContainer>

  <AccountFormDialog
    v-model:open="formOpen"
    :account="editingAccount"
  />

  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir conta"
    description="Todos os dados desta conta serão removidos."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
