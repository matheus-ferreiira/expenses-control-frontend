<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import { AppPageContainer, ConfirmDialog, EmptyState, PageHeader } from '@/components/shared'
import AccountCard from '@/features/finance/components/AccountCard.vue'
import AccountFormDialog from '@/features/finance/components/AccountFormDialog.vue'
import { Skeleton } from '@ui/skeleton'
import { Plus, Landmark, ChevronDown, ChevronRight, CalendarDays } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import type { BalanceObservation, BankAccount } from '@/types/finance'
import { financeApi } from '@/services/api/finance'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const store = useFinanceStore()
const toast = useToast()
const router = useRouter()
// ── Saldo em uma data (sheet) ───────────────────────────────────────────────
const datedOpen = ref(false)
const balanceDate = ref(new Date().toLocaleDateString('en-CA'))
const datedBalances = ref<{ id: string; name: string; reserve: boolean; balance_cents: number | null }[]>([])
const checkingBalances = ref(false)
async function checkBalances() {
  if (!balanceDate.value) return
  checkingBalances.value = true
  try {
    datedBalances.value = await Promise.all(store.activeAccounts.map(async (account) => ({
      id: account.id, name: account.name, reserve: account.is_reserve ?? account.type === 'investment',
      ...await financeApi.accounts.balanceAt(account.id, balanceDate.value),
    })))
  } catch { toast.error('Não foi possível consultar os saldos por data') }
  finally { checkingBalances.value = false }
}
function openDatedBalances() {
  datedOpen.value = true
  checkBalances()
}
// Accounts without a verified balance on that date stay out of the total, which says so
const datedAvailable = computed(() => datedBalances.value.filter((b) => !b.reserve))
const datedAvailableTotal = computed(() => datedAvailable.value.reduce((s, b) => s + (b.balance_cents ?? 0), 0) / 100)
const datedMissing = computed(() => datedAvailable.value.filter((b) => b.balance_cents === null).length)
const datedKnown = computed(() => datedAvailable.value.length - datedMissing.value)

// ── Movimento do mês por conta ──────────────────────────────────────────────
const movements = ref<Record<string, { in: number; out: number }>>({})
const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
async function loadMovements() {
  const now = new Date()
  try {
    const rows = await financeApi.accounts.movements(now.getFullYear(), now.getMonth() + 1)
    movements.value = Object.fromEntries(rows.map((r) => [r.account_id, { in: r.in, out: r.out }]))
  } catch {
    // the list still works without the month's movement
  }
}
function movementFor(id: string) {
  const m = movements.value[id]
  return m ? { ...m, monthLabel } : null
}

const accountGroups = computed(() => [
  { key: 'available', label: 'Disponível', accounts: store.availableAccounts, total: store.availableBalance },
  { key: 'reserve', label: 'Guardado', accounts: store.reserveAccounts, total: store.reserveBalance },
].filter((g) => g.accounts.length))

/** Toque na conta → Visão Geral filtrada pelas transações dela */
function viewStatement(account: BankAccount) {
  router.push({ name: ROUTES.FINANCE, query: { account_id: account.id } })
}

// Conferência datada: preserva o valor observado sem criar receita/despesa.
const adjustOpen = ref(false)
const adjustTarget = ref<BankAccount | null>(null)
const adjustDisplay = ref('')
const adjusting = ref(false)
// What the app calculates for today — the base the backend compares the check against (D-42)
const adjustBase = ref<number | null>(null)
const adjustHistory = ref<BalanceObservation[]>([])

async function openAdjust(account: BankAccount) {
  adjustTarget.value = account
  adjustDisplay.value = account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  adjustBase.value = account.balance
  adjustHistory.value = []
  adjustOpen.value = true
  try {
    const [at, history] = await Promise.all([
      financeApi.accounts.balanceAt(account.id, new Date().toLocaleDateString('en-CA')),
      financeApi.accounts.balanceObservations(account.id),
    ])
    if (at.balance_cents !== null) adjustBase.value = at.balance_cents / 100
    adjustHistory.value = history.slice(0, 5)
  } catch {
    // the check still works against the recorded balance
  }
}

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function onAdjustInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  adjustDisplay.value = digits
    ? (parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''
  ;(e.target as HTMLInputElement).value = adjustDisplay.value
}

const adjustParsed = computed(() => {
  const v = parseFloat(adjustDisplay.value.replace(/\./g, '').replace(',', '.'))
  return isNaN(v) ? null : v
})

const adjustDiff = computed(() => {
  if (adjustBase.value === null || adjustParsed.value === null) return 0
  return Math.round((adjustParsed.value - adjustBase.value) * 100) / 100
})

async function confirmAdjust() {
  if (!adjustTarget.value || adjustParsed.value === null || adjusting.value) return
  adjusting.value = true
  try {
    const result = await financeApi.accounts.observeBalance(adjustTarget.value.id, {
      date: new Date().toLocaleDateString('en-CA'),
      balance: adjustParsed.value.toFixed(2),
      evidence: 'Conferência manual informada pelo titular no aplicativo',
    })
    await store.fetchAccounts()
    if (result.opening_created) toast.success('Saldo inicial da conta registrado — agora ela entra no saldo previsto')
    else toast.success(result.difference_cents ? `Conferência registrada. Diferença: ${formatCurrency(result.difference_cents / 100)}` : 'Conferência registrada: o saldo bate')
    adjustOpen.value = false
    adjustTarget.value = null
  } catch {
    toast.error('Erro ao registrar conferência')
  } finally {
    adjusting.value = false
  }
}

const formOpen = ref(false)
const editingAccount = ref<BankAccount | null>(null)
const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)
const loading = ref(false)

// Archive / unarchive state
const archiveOpen = ref(false)
const archiveTarget = ref<BankAccount | null>(null)
const archiving = ref(false)
const showArchived = ref(false)

const totalBalance = computed(() => store.availableBalance)

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
  } catch (e: unknown) {
    // An account with transactions is archived instead (D-25): show why
    const data = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data
    toast.error(data?.errors?.account?.[0] ?? data?.message ?? 'Erro ao excluir conta')
    deleteOpen.value = false
  } finally {
    deleting.value = false
  }
}

function requestArchive(account: BankAccount) {
  archiveTarget.value = account
  archiveOpen.value = true
}

async function confirmArchive() {
  if (!archiveTarget.value) return
  archiving.value = true
  try {
    await store.updateAccount(archiveTarget.value.id, { is_active: false })
    toast.success('Conta arquivada')
    archiveOpen.value = false
    archiveTarget.value = null
  } catch {
    toast.error('Erro ao arquivar conta')
  } finally {
    archiving.value = false
  }
}

async function unarchiveAccount(account: BankAccount) {
  try {
    await store.updateAccount(account.id, { is_active: true })
    toast.success('Conta reativada')
  } catch {
    toast.error('Erro ao reativar conta')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([store.fetchAccounts(), loadMovements()])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />
    <PageHeader title="Contas" subtitle="Saldos, conferências e o movimento de cada conta." compact-mobile>
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors"
          @click="openCreate"
        >
          <Plus :size="14" />
          Nova conta
        </button>
      </template>
    </PageHeader>

    <!-- Summary: what is available to spend, what is put away -->
    <div v-if="!loading && store.activeAccounts.length" class="mb-4 rounded-lg bg-card p-4">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Disponível</p>
      <p class="text-[26px] font-semibold tabular-nums leading-tight mt-1" :class="totalBalance < 0 ? 'text-destructive' : 'text-foreground'">
        {{ formatCurrency(totalBalance) }}
      </p>
      <div class="mt-2 flex items-center justify-between gap-3">
        <p class="text-[12px] text-muted-foreground">
          <template v-if="store.reserveAccounts.length">
            <span class="whitespace-nowrap">Guardado <span class="text-primary font-medium tabular-nums">{{ formatCurrency(store.reserveBalance) }}</span></span> ·
          </template>
          <span class="whitespace-nowrap">{{ store.activeAccounts.length }} conta{{ store.activeAccounts.length !== 1 ? 's' : '' }}</span>
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          @click="openDatedBalances"
        >
          <CalendarDays :size="13" />
          Saldo em uma data
        </button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-3">
      <div v-for="i in 3" :key="i" class="rounded-lg bg-card p-3.5 space-y-2.5">
        <div class="flex items-center gap-2.5">
          <Skeleton class="h-4 w-4 rounded shrink-0" />
          <div class="space-y-1.5 flex-1">
            <Skeleton class="h-3.5 w-24" />
            <Skeleton class="h-2.5 w-14" />
          </div>
        </div>
        <Skeleton class="h-5 w-28 mt-2" />
      </div>
    </div>

    <!-- Empty (no accounts at all) -->
    <EmptyState
      v-else-if="store.accounts.length === 0"
      :icon="Landmark"
      title="Nenhuma conta cadastrada"
      description="Adicione suas contas bancárias para acompanhar seu saldo."
      cta-label="Nova conta"
      @cta="openCreate"
    />

    <template v-else>
      <!-- Disponível and Guardado, each with its subtotal -->
      <section v-for="group in accountGroups" :key="group.key" class="mb-4">
        <div class="flex items-center justify-between px-1 mb-1.5">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{{ group.label }}</p>
          <p class="text-[12px] tabular-nums text-muted-foreground">{{ formatCurrency(group.total) }}</p>
        </div>
        <div class="rounded-lg bg-card divide-y divide-border overflow-hidden">
          <AccountCard
            v-for="account in group.accounts"
            :key="account.id"
            :account="account"
            :movement="movementFor(account.id)"
            @view="viewStatement"
            @edit="openEdit"
            @adjust="openAdjust"
            @delete="openDelete"
            @archive="requestArchive"
            @unarchive="unarchiveAccount"
          />
        </div>
      </section>

      <!-- Archived accounts — collapsible section -->
      <div v-if="store.archivedAccounts.length > 0" class="mt-6">
        <button
          type="button"
          class="flex items-center gap-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
          @click="showArchived = !showArchived"
        >
          <component :is="showArchived ? ChevronDown : ChevronRight" :size="14" />
          <span>{{ showArchived ? 'Ocultar' : 'Ver' }} contas arquivadas ({{ store.archivedAccounts.length }})</span>
        </button>
        <div v-if="showArchived" class="rounded-lg bg-card divide-y divide-border overflow-hidden opacity-60">
          <AccountCard
            v-for="account in store.archivedAccounts"
            :key="account.id"
            :account="account"
            @edit="openEdit"
            @delete="openDelete"
            @archive="requestArchive"
            @unarchive="unarchiveAccount"
          />
        </div>
      </div>
    </template>
  </AppPageContainer>

  <AccountFormDialog
    v-model:open="formOpen"
    :account="editingAccount"
  />

  <!-- Saldo em uma data -->
  <Sheet v-model:open="datedOpen">
    <SheetContent side="bottom" class="rounded-t-2xl p-0 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
      <SheetHeader class="text-left px-5 pt-3">
        <SheetTitle class="text-[15px]">Saldo em uma data</SheetTitle>
        <SheetDescription class="text-[12px]">Quanto havia em cada conta no fim do dia escolhido.</SheetDescription>
      </SheetHeader>
      <div class="px-5 pb-6 mt-4">
        <input
          v-model="balanceDate"
          type="date"
          :max="new Date().toLocaleDateString('en-CA')"
          aria-label="Data"
          class="w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none"
          @change="checkBalances"
        />
        <div class="mt-4 rounded-lg bg-card divide-y divide-border" :class="checkingBalances ? 'opacity-50' : ''">
          <div v-for="b in datedBalances" :key="b.id" class="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]">
            <span class="truncate">{{ b.name }}<span v-if="b.reserve" class="text-muted-foreground"> · guardado</span></span>
            <span v-if="b.balance_cents === null" class="text-[12px] text-muted-foreground shrink-0">sem saldo conferido nessa data</span>
            <span v-else class="tabular-nums font-medium shrink-0" :class="b.balance_cents < 0 ? 'text-destructive' : 'text-foreground'">{{ formatCurrency(b.balance_cents / 100) }}</span>
          </div>
          <div v-if="datedKnown" class="flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold">
            <span>Disponível<span v-if="datedMissing" class="font-normal text-muted-foreground"> (só contas conferidas)</span></span>
            <span class="tabular-nums">{{ formatCurrency(datedAvailableTotal) }}</span>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Archive confirmation -->
  <ConfirmDialog
    v-model:open="archiveOpen"
    title="Arquivar conta"
    :description="`'${archiveTarget?.name}' será ocultada da lista principal. O histórico de transações é mantido.`"
    confirm-label="Arquivar"
    :loading="archiving"
    @confirm="confirmArchive"
  />

  <!-- Delete confirmation -->
  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir conta"
    description="A conta será excluída. Contas com lançamentos não podem ser excluídas: arquive-as para escondê-las mantendo o histórico."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />

  <!-- Ajustar saldo -->
  <AlertDialog v-model:open="adjustOpen">
    <AlertDialogContent class="max-w-sm">
      <AlertDialogHeader>
        <AlertDialogTitle class="text-[15px]">Conferir saldo — {{ adjustTarget?.name }}</AlertDialogTitle>
        <AlertDialogDescription class="text-[13px]">
          Informe o saldo real da conta. A conferência será registrada; diferenças ficarão pendentes de conciliação.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="mt-1">
        <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
          Saldo real (R$)
        </p>
        <div class="flex items-center gap-2 h-10 px-3 rounded-lg bg-card transition-colors">
          <span class="text-[12px] text-muted-foreground shrink-0">R$</span>
          <input
            :value="adjustDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0,00"
            class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
            @input="onAdjustInput"
          />
        </div>
        <p v-if="adjustDiff !== 0" class="text-[11px] mt-1.5" :class="adjustDiff > 0 ? 'text-success' : 'text-destructive'">
          Diferença de {{ adjustDiff > 0 ? '+' : '' }}{{ formatCurrency(adjustDiff) }} em relação ao saldo calculado pelo app
        </p>
        <p v-if="adjustTarget && adjustTarget.balance_verified === false" class="text-[11px] mt-1.5 text-muted-foreground">
          Esta conta ainda não tem saldo conferido: o valor informado vira o saldo inicial dela.
        </p>

        <!-- History (D-42) -->
        <div v-if="adjustHistory.length" class="mt-4">
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">Conferências anteriores</p>
          <div v-for="h in adjustHistory" :key="h.id" class="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-[12px]">
            <span class="text-muted-foreground">{{ formatDay(h.observed_on) }} · {{ h.kind === 'opening' ? 'saldo inicial' : 'conferência' }}</span>
            <span class="tabular-nums text-foreground">
              {{ formatCurrency(h.observed_cents / 100) }}
              <span v-if="h.difference_cents" :class="h.difference_cents > 0 ? 'text-success' : 'text-destructive'">
                ({{ h.difference_cents > 0 ? '+' : '' }}{{ formatCurrency(h.difference_cents / 100) }})
              </span>
            </span>
          </div>
        </div>
      </div>

      <AlertDialogFooter class="gap-2">
        <AlertDialogCancel class="flex-1 h-[52px] rounded-xl text-[15px] bg-muted text-muted-foreground">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] bg-primary text-primary-foreground"
          :disabled="adjustParsed === null || adjusting"
          @click="confirmAdjust"
        >
          Registrar conferência
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
