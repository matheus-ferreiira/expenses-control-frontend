<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import BankAccountTransactionsSheet from '@/features/finance/components/BankAccountTransactionsSheet.vue'
import LinkBankAccountSheet from '@/features/finance/components/LinkBankAccountSheet.vue'
import { ROUTES } from '@/constants/routes'
import { openPluggyConnect } from '@/features/finance/composables/usePluggyConnect'
import { AppPageContainer, ConfirmDialog, EmptyState, PageHeader } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertTriangle, ChevronRight, CreditCard, ExternalLink, Inbox, Landmark, Loader2, MoreHorizontal, Pencil, PlugZap, RefreshCw, Unplug,
} from 'lucide-vue-next'
import { bankConnectionsApi } from '@/services/api/bankConnections'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { daysUntil, formatDayMonth } from '@/features/finance/utils/financeHelpers'
import { toISODate } from '@/utils/date'
import type { BankConnection, BankConnectionAccount, BankConnectionsOverview } from '@/types/bankConnections'

const toast = useToast()
const router = useRouter()

const loading = ref(true)
const loadError = ref(false)
const configured = ref(true)
const includeSandbox = ref(false)
const overview = ref<BankConnectionsOverview | null>(null)
const connections = computed(() => overview.value?.connections ?? [])
const totals = computed(() => overview.value?.totals ?? { bank_balance_cents: 0, card_balance_cents: 0, accounts_count: 0, to_review_count: 0 })
const hasCards = computed(() => connections.value.some((c) => c.accounts.some((a) => a.type === 'credit')))

/** Widget aberto ou primeira leitura do banco em andamento */
const connecting = ref(false)
const syncingId = ref<string | null>(null)

function apiMessage(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
  return data?.errors ? Object.values(data.errors)[0]?.[0] ?? fallback : data?.message || fallback
}

async function refresh() {
  overview.value = await bankConnectionsApi.overview()
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const status = await bankConnectionsApi.status()
    configured.value = status.configured
    includeSandbox.value = status.include_sandbox
    if (status.configured) await refresh()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

/** Novo banco, ou a mesma conexão de novo para renovar a autorização */
async function connectBank(connection?: BankConnection) {
  if (connecting.value) return
  connecting.value = true
  try {
    const token = await bankConnectionsApi.connectToken(connection?.id)
    const result = await openPluggyConnect({
      connectToken: token.access_token,
      includeSandbox: includeSandbox.value,
      updateItem: token.update_item_id,
    })
    if (!result.itemId) {
      if (result.error) toast.error('A conexão não foi concluída', result.error)
      return
    }
    const saved = await bankConnectionsApi.register(result.itemId)
    await refresh()
    toast.success(connection ? 'Autorização renovada' : `${saved.name} conectado`)
  } catch (e) {
    toast.error(apiMessage(e, 'Não foi possível conectar o banco'))
  } finally {
    connecting.value = false
  }
}

async function syncConnection(connection: BankConnection) {
  if (syncingId.value) return
  syncingId.value = connection.id
  try {
    await bankConnectionsApi.sync(connection.id)
    await refresh()
    toast.success('Dados do banco atualizados')
  } catch (e) {
    toast.error(apiMessage(e, 'Não foi possível atualizar agora'))
    await refresh().catch(() => {})
  } finally {
    syncingId.value = null
  }
}

// ── Renomear ────────────────────────────────────────────────────────────────
const renameOpen = ref(false)
const renameTarget = ref<BankConnection | null>(null)
const renameValue = ref('')
const renaming = ref(false)

function openRename(connection: BankConnection) {
  renameTarget.value = connection
  renameValue.value = connection.custom_name ?? connection.name
  renameOpen.value = true
}

async function confirmRename() {
  if (!renameTarget.value || renaming.value) return
  renaming.value = true
  try {
    await bankConnectionsApi.rename(renameTarget.value.id, renameValue.value.trim() || null)
    await refresh()
    renameOpen.value = false
  } catch (e) {
    toast.error(apiMessage(e, 'Não foi possível renomear'))
  } finally {
    renaming.value = false
  }
}

// ── Desconectar ─────────────────────────────────────────────────────────────
const disconnectOpen = ref(false)
const disconnectTarget = ref<BankConnection | null>(null)
const disconnecting = ref(false)

function requestDisconnect(connection: BankConnection) {
  disconnectTarget.value = connection
  disconnectOpen.value = true
}

async function confirmDisconnect() {
  if (!disconnectTarget.value) return
  disconnecting.value = true
  try {
    await bankConnectionsApi.disconnect(disconnectTarget.value.id)
    await refresh()
    toast.success(`${disconnectTarget.value.name} desconectado`)
    disconnectOpen.value = false
    disconnectTarget.value = null
  } catch (e) {
    toast.error(apiMessage(e, 'Não foi possível desconectar'))
  } finally {
    disconnecting.value = false
  }
}

// ── Transações de uma conta ─────────────────────────────────────────────────
const txOpen = ref(false)
const txAccount = ref<BankConnectionAccount | null>(null)
const txBankName = ref('')

function openTransactions(connection: BankConnection, account: BankConnectionAccount) {
  txAccount.value = account
  txBankName.value = connection.name
  txOpen.value = true
}

// ── Ligar uma conta do banco a uma conta do app ─────────────────────────────
const linkOpen = ref(false)
const linkAccount = ref<BankConnectionAccount | null>(null)
const linkBankName = ref('')

function openLink(account: BankConnectionAccount) {
  linkAccount.value = account
  linkBankName.value = connections.value.find((c) => c.accounts.some((a) => a.id === account.id))?.name ?? ''
  txOpen.value = false
  linkOpen.value = true
}

async function onLinked() {
  await refresh().catch(() => {})
}

// ── Rótulos ─────────────────────────────────────────────────────────────────
/** "hoje às 06:02", "ontem às 18:00", "12/11 às 06:00" */
function whenLabel(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const days = -daysUntil(toISODate(d))
  if (days === 0) return `hoje às ${time}`
  if (days === 1) return `ontem às ${time}`
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${time}`
}

function statusLine(c: BankConnection): { text: string; tone: 'muted' | 'warning' } {
  if (c.needs_action) return { text: c.last_sync_error ?? 'O banco pede uma nova autorização', tone: 'warning' }
  if (c.last_sync_error) return { text: c.last_sync_error, tone: 'warning' }
  if (c.status === 'UPDATING') return { text: 'O banco está sendo lido agora', tone: 'muted' }
  const read = c.provider_updated_at ?? c.last_synced_at
  return { text: read ? `Banco lido ${whenLabel(read)}` : 'Aguardando a primeira leitura', tone: 'muted' }
}

/** Aviso quando a autorização (1 ano no MeuPluggy) vence em até 30 dias */
function consentNote(c: BankConnection): string | null {
  if (!c.consent_expires_at || c.needs_action) return null
  const day = toISODate(new Date(c.consent_expires_at))
  const days = daysUntil(day)
  return days <= 30 ? `Autorização vence em ${formatDayMonth(day)}` : null
}

const SUBTYPE_LABELS: Record<string, string> = {
  CHECKING_ACCOUNT: 'Conta corrente',
  SAVINGS_ACCOUNT: 'Poupança',
  CREDIT_CARD: 'Cartão',
}

function accountSubtitle(a: BankConnectionAccount): string {
  const parts: string[] = []
  if (a.type === 'credit') {
    if (a.number) parts.push(`•••• ${a.number.slice(-4)}`)
    if (a.balance_due_date) parts.push(`vence ${formatDayMonth(a.balance_due_date)}`)
  } else {
    parts.push(SUBTYPE_LABELS[a.subtype ?? ''] ?? 'Conta')
    if (a.number) parts.push(a.number)
  }
  parts.push(a.link ? `→ ${a.link.name}` : 'não ligada ao app')
  return parts.join(' · ')
}
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />
    <PageHeader title="Bancos conectados" subtitle="Saldos e transações lidos direto do banco pelo Open Finance." compact-mobile>
      <template v-if="configured && !loading && !loadError" #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-40"
          :disabled="connecting"
          @click="connectBank()"
        >
          <Loader2 v-if="connecting" class="size-3.5 animate-spin" />
          <PlugZap v-else class="size-3.5" />
          Conectar banco
        </button>
      </template>
    </PageHeader>

    <!-- Loading: same two columns as the loaded page -->
    <div v-if="loading" class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0 bg-card rounded-lg p-4">
        <Skeleton class="h-2.5 w-16 mb-3" />
        <div class="grid grid-cols-2 gap-3">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </div>
      </div>
      <div class="bg-card rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-border"><Skeleton class="h-2.5 w-24" /></div>
        <div v-for="i in 3" :key="i" class="flex items-center gap-3 px-4 py-2.5">
          <Skeleton class="size-8 rounded-lg shrink-0" />
          <div class="flex-1 space-y-1.5">
            <Skeleton class="h-3 w-1/3" />
            <Skeleton class="h-2.5 w-1/4" />
          </div>
          <Skeleton class="h-3.5 w-20 shrink-0" />
        </div>
      </div>
    </div>

    <div v-else-if="loadError" class="bg-card rounded-lg">
      <EmptyState
        :icon="PlugZap"
        title="Não foi possível carregar"
        description="Confira sua conexão e tente de novo."
        cta-label="Tentar de novo"
        :cta-icon="RefreshCw"
        @cta="load"
      />
    </div>

    <div v-else-if="!configured" class="bg-card rounded-lg">
      <EmptyState
        :icon="PlugZap"
        title="Conexão bancária desativada"
        description="O servidor ainda não tem as credenciais da Pluggy (PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET)."
      />
    </div>

    <!-- Desktop: resumo à esquerda, bancos à direita (como na Visão Geral) -->
    <div v-else class="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] lg:gap-5 xl:gap-6 lg:items-start">
      <div class="mb-4 lg:mb-0 space-y-3">
        <div v-if="connections.length" class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">No banco</p>
            <span class="text-[11px] text-muted-foreground">
              {{ connections.length }} banco{{ connections.length !== 1 ? 's' : '' }} ·
              {{ totals.accounts_count }} conta{{ totals.accounts_count !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="grid gap-3" :class="hasCards ? 'grid-cols-2' : 'grid-cols-1'">
            <div>
              <p class="text-[12px] text-muted-foreground mb-1">Nas contas</p>
              <p
                class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap"
                :class="totals.bank_balance_cents < 0 ? 'text-destructive' : 'text-foreground'"
              >{{ formatCurrency(totals.bank_balance_cents / 100) }}</p>
            </div>
            <div v-if="hasCards">
              <p class="text-[12px] text-muted-foreground mb-1">Faturas abertas</p>
              <p class="text-[20px] font-semibold tabular-nums leading-none whitespace-nowrap text-foreground">
                {{ formatCurrency(totals.card_balance_cents / 100) }}
              </p>
            </div>
          </div>
          <button
            v-if="totals.to_review_count > 0"
            type="button"
            class="mt-3 w-full flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-[12px] hover:opacity-80 transition-opacity"
            @click="router.push({ name: ROUTES.FINANCE_CONNECTIONS_REVIEW })"
          >
            <span class="inline-flex items-center gap-1.5 text-foreground">
              <Inbox :size="14" class="text-warning shrink-0" />
              <span class="font-medium">{{ totals.to_review_count }}</span> a lançar no app
            </span>
            <ChevronRight :size="14" class="text-muted-foreground shrink-0" />
          </button>
          <p class="mt-3 text-[11px] text-muted-foreground leading-snug">
            É o que o banco informa. Ligue cada conta a uma conta do app: o que já estiver lá é conferido, o que faltar
            vai para "A lançar" e só entra com sua aprovação.
          </p>
        </div>

        <div class="bg-card rounded-lg p-4">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Como conectar</p>
          <ol class="space-y-2 text-[13px] text-foreground list-decimal pl-4 marker:text-muted-foreground">
            <li>
              Conecte seus bancos no
              <a href="https://meu.pluggy.ai" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-0.5 text-primary font-medium hover:underline">
                Meu Pluggy <ExternalLink :size="11" aria-hidden="true" />
              </a>
              (Open Finance, gratuito).
            </li>
            <li>Aqui, toque em <span class="font-medium">Conectar banco</span> e escolha <span class="font-medium">MeuPluggy</span>.</li>
            <li>Autorize cada banco: uma conexão por banco.</li>
            <li>Toque em cada conta e <span class="font-medium">ligue ao app</span> (Nubank → conta Nubank, cartão → cartão).</li>
            <li>Confira em <span class="font-medium">A lançar</span> o que falta e aprove.</li>
          </ol>
          <p class="mt-3 text-[11px] text-muted-foreground leading-snug">
            O Meu Pluggy lê o banco uma vez por dia e o VaultOS confere de hora em hora; o que for novo aparece em
            "A lançar" até uma hora depois. A autorização vale 1 ano. Sua senha do banco nunca passa pelo VaultOS.
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <div v-if="!connections.length" class="bg-card rounded-lg">
          <EmptyState
            :icon="PlugZap"
            title="Nenhum banco conectado"
            description="Conecte um banco para ver saldos e transações lidos direto dele."
            cta-label="Conectar banco"
            :cta-icon="PlugZap"
            @cta="connectBank()"
          />
        </div>

        <section v-for="c in connections" :key="c.id" class="bg-card rounded-lg overflow-hidden">
          <div class="flex items-center gap-3 pl-4 pr-1 py-3 border-b border-border">
            <span class="flex items-center justify-center size-8 rounded-lg shrink-0 bg-muted text-[13px] font-semibold text-foreground" aria-hidden="true">
              {{ c.name.charAt(0).toUpperCase() }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-foreground truncate">{{ c.name }}</p>
              <p
                class="flex items-center gap-1 text-[12px] mt-0.5 min-w-0"
                :class="statusLine(c).tone === 'warning' ? 'text-warning' : 'text-muted-foreground'"
              >
                <AlertTriangle v-if="statusLine(c).tone === 'warning'" :size="12" class="shrink-0" aria-hidden="true" />
                <span class="truncate">{{ statusLine(c).text }}</span>
              </p>
              <p v-if="consentNote(c)" class="text-[11px] text-warning mt-0.5">{{ consentNote(c) }}</p>
            </div>
            <button
              v-if="c.needs_action"
              type="button"
              class="h-8 px-3 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground shrink-0 disabled:opacity-40"
              :disabled="connecting"
              @click="connectBank(c)"
            >
              Autorizar
            </button>
            <Loader2 v-else-if="syncingId === c.id" :size="15" class="animate-spin text-muted-foreground shrink-0 mx-3" aria-label="Atualizando" />
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  :aria-label="`Opções de ${c.name}`"
                  class="flex items-center justify-center size-10 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                >
                  <MoreHorizontal :size="15" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48">
                <DropdownMenuItem :disabled="!!syncingId" @click="syncConnection(c)">
                  <RefreshCw :size="12" class="mr-2" />
                  Buscar dados agora
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="connecting" @click="connectBank(c)">
                  <PlugZap :size="12" class="mr-2" />
                  Autorizar de novo
                </DropdownMenuItem>
                <DropdownMenuItem @click="openRename(c)">
                  <Pencil :size="12" class="mr-2" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-destructive focus:text-destructive" @click="requestDisconnect(c)">
                  <Unplug :size="12" class="mr-2" />
                  Desconectar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div class="divide-y divide-border">
            <button
              v-for="a in c.accounts"
              :key="a.id"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              :aria-label="`Ver transações de ${a.name}`"
              @click="openTransactions(c, a)"
            >
              <span class="flex items-center justify-center size-8 rounded-lg shrink-0 bg-muted text-muted-foreground">
                <CreditCard v-if="a.type === 'credit'" :size="15" :stroke-width="1.9" />
                <Landmark v-else :size="15" :stroke-width="1.9" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="flex items-baseline justify-between gap-2">
                  <span class="text-[14px] font-medium text-foreground truncate">{{ a.name }}</span>
                  <span
                    class="text-[14px] font-semibold tabular-nums whitespace-nowrap"
                    :class="a.type === 'bank' && a.balance_cents < 0 ? 'text-destructive' : 'text-foreground'"
                  >{{ formatCurrency(a.balance_cents / 100) }}</span>
                </span>
                <span class="flex items-baseline justify-between gap-2 text-[12px] text-muted-foreground mt-0.5">
                  <span class="truncate">{{ accountSubtitle(a) }}</span>
                  <span v-if="a.to_review_count" class="whitespace-nowrap shrink-0 text-warning font-medium">{{ a.to_review_count }} a lançar</span>
                  <span v-else-if="a.type === 'credit'" class="whitespace-nowrap shrink-0">fatura aberta</span>
                </span>
                <span v-if="a.type === 'credit' && a.available_credit_limit_cents !== null" class="block text-[11.5px] text-muted-foreground tabular-nums mt-0.5">
                  Limite livre {{ formatCurrency(a.available_credit_limit_cents / 100) }}<template v-if="a.credit_limit_cents"> de {{ formatCurrency(a.credit_limit_cents / 100) }}</template>
                </span>
              </span>
            </button>
            <p v-if="!c.accounts.length" class="px-4 py-3 text-[12px] text-muted-foreground">
              Nenhuma conta lida ainda. Use “Buscar dados agora” em alguns instantes.
            </p>
          </div>
        </section>
      </div>
    </div>
  </AppPageContainer>

  <BankAccountTransactionsSheet
    v-model:open="txOpen"
    :account="txAccount"
    :bank-name="txBankName"
    @link="openLink"
    @changed="onLinked"
  />
  <LinkBankAccountSheet v-model:open="linkOpen" :account="linkAccount" :bank-name="linkBankName" @saved="onLinked" />

  <!-- Renomear -->
  <Sheet v-model:open="renameOpen">
    <SheetContent side="bottom" class="rounded-t-2xl p-0 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
      <SheetHeader class="text-left px-5 pt-3">
        <SheetTitle class="text-[15px]">Renomear banco</SheetTitle>
        <SheetDescription class="text-[12px]">Deixe em branco para usar o nome automático.</SheetDescription>
      </SheetHeader>
      <form class="px-5 pb-6 space-y-5 mt-4" @submit.prevent="confirmRename">
        <input
          v-model="renameValue"
          type="text"
          maxlength="80"
          aria-label="Nome do banco"
          placeholder="Ex.: Nubank pessoal"
          class="w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground"
        />
        <div class="flex gap-2">
          <button type="button" class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-muted text-foreground" @click="renameOpen = false">
            Cancelar
          </button>
          <button type="submit" class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-primary text-primary-foreground disabled:opacity-40" :disabled="renaming">
            Salvar
          </button>
        </div>
      </form>
    </SheetContent>
  </Sheet>

  <ConfirmDialog
    v-model:open="disconnectOpen"
    title="Desconectar banco"
    :description="`O VaultOS deixa de ler '${disconnectTarget?.name}' e apaga a cópia das contas e transações lidas dele. Suas contas e lançamentos do VaultOS não mudam.`"
    confirm-label="Desconectar"
    variant="destructive"
    :loading="disconnecting"
    @confirm="confirmDisconnect"
  />
</template>
