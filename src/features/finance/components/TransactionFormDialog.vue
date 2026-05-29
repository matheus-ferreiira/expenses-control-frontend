<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import { Textarea } from '@ui/textarea'
import {
  ArrowLeft, Loader2, Plus, Repeat, X, CreditCard,
  TrendingDown, TrendingUp, ArrowRightLeft,
  Wallet, ChevronDown, Check,
} from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import CategoryQuickCreateSheet from './CategoryQuickCreateSheet.vue'
import type { Transaction, TransactionType, RecurrenceUpdateScope } from '@/types/finance'
import { useTransactionForm } from '../composables/useTransactionForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { toISODate } from '@/utils/date'
import RecurringEditScopeDialog from './RecurringEditScopeDialog.vue'

export interface TransactionPrefill {
  type?: TransactionType
  description?: string
  amount?: string
  category_id?: string
  account_id?: string
}

const props = defineProps<{
  open: boolean
  transaction?: Transaction | null
  prefill?: TransactionPrefill | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [t: Transaction]
  updated: [t: Transaction]
}>()

const store = useFinanceStore()
const toast = useToast()
const { form, errors, submitting, fromTransaction, reset, validate, applyApiErrors, toPayload } =
  useTransactionForm()

// ── UI state ─────────────────────────────────────────────────────────────────
const amountInputRef = ref<HTMLInputElement | null>(null)
const categoryDropdownOpen = ref(false)

// ── Form validity ─────────────────────────────────────────────────────────────
const isFormValid = computed(() => {
  const parsed = parseFloat(form.amount.replace(',', '.'))
  const baseValid = form.description.trim().length > 0 && !isNaN(parsed) && parsed > 0 && !!form.account_id
  if (form.type === 'transfer') {
    return baseValid && !!form.destination_account_id && form.destination_account_id !== form.account_id
  }
  if (form.total_installments > 0 && form.total_installments < 2) return false
  return baseValid
})

// ── Quick amount increments ───────────────────────────────────────────────────
const QUICK_INCREMENTS = [10, 50, 100, 500]

function addAmount(inc: number) {
  const current = parseFloat(form.amount.replace(',', '.')) || 0
  form.amount = (current + inc).toFixed(2).replace('.', ',')
}

// ── Recurring scope dialog ───────────────────────────────────────────────────
const scopeDialogOpen = ref(false)

const isEditingRecurring = computed(
  () => !!props.transaction?.recurrence_group_id,
)

// ── Recurrence config UI ─────────────────────────────────────────────────────
const FREQUENCY_OPTIONS = [
  { value: 'weekly',      label: 'Semanal' },
  { value: 'biweekly',   label: 'Quinzenal' },
  { value: 'monthly',    label: 'Mensal' },
  { value: 'bimonthly',  label: 'Bimestral' },
  { value: 'quarterly',  label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual',     label: 'Anual' },
] as const

const FREQ_LABELS: Record<string, string> = {
  weekly: 'semana', biweekly: 'quinzena', monthly: 'mês',
  bimonthly: '2 meses', quarterly: '3 meses', semiannual: '6 meses', annual: 'ano',
}

const nextOccurrenceLabel = computed(() => {
  if (!form.transaction_date) return ''
  const d = new Date(form.transaction_date + 'T12:00:00')
  const freq = form.recurrence_frequency
  if (freq === 'weekly') d.setDate(d.getDate() + 7)
  else if (freq === 'biweekly') d.setDate(d.getDate() + 14)
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (freq === 'bimonthly') d.setMonth(d.getMonth() + 2)
  else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (freq === 'semiannual') d.setMonth(d.getMonth() + 6)
  else if (freq === 'annual') d.setFullYear(d.getFullYear() + 1)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
})

// ── Installments ─────────────────────────────────────────────────────────────
const INSTALLMENT_OPTIONS = [2, 3, 6, 12, 18, 24]

const isInstallment = computed(() => form.total_installments >= 2)

const installmentAmount = computed(() => {
  const total = parseFloat(form.amount.replace(',', '.'))
  if (!total || total <= 0 || !isInstallment.value) return 0
  return Math.floor((total / form.total_installments) * 100) / 100
})

function toggleInstallments(n: number) {
  if (form.total_installments === n) {
    form.total_installments = 0
  } else {
    form.total_installments = n
    form.is_recurring = false
  }
}

// ── Tags ────────────────────────────────────────────────────────────────────
const newTagName = ref('')
const creatingTag = ref(false)

function toggleTag(id: string) {
  const idx = form.tag_ids.indexOf(id)
  if (idx === -1) form.tag_ids.push(id)
  else form.tag_ids.splice(idx, 1)
}

async function createInlineTag() {
  const name = newTagName.value.trim()
  if (!name) return
  creatingTag.value = true
  try {
    const tag = await store.createTag({ name, color: '#6b7280' })
    form.tag_ids.push(tag.id)
    newTagName.value = ''
  } catch {
    toast.error('Erro ao criar tag')
  } finally {
    creatingTag.value = false
  }
}

// ── Quick-create category sheet ──────────────────────────────────────────────
const showCategorySheet = ref(false)

// ── Categories ───────────────────────────────────────────────────────────────
const filteredCategories = computed(() =>
  store.categories.filter(
    (c) => form.type !== 'transfer' && (!form.type || c.type === form.type),
  ),
)

const selectedCategory = computed(() =>
  store.categories.find((c) => c.id === form.category_id) ?? null,
)

const descriptionPlaceholder = computed(() => {
  if (!selectedCategory.value) return 'Onde/o quê? Ex: iFood, Salário'
  const cat = selectedCategory.value.name.toLowerCase()
  const placeholders: Record<string, string> = {
    'alimentação': 'iFood, Restaurante, Mercado...',
    'transporte': 'Uber, Gasolina, Passagem...',
    'moradia': 'Aluguel, Condomínio, IPTU...',
    'saúde': 'Farmácia, Consulta, Academia...',
    'lazer': 'Netflix, Cinema, Parque...',
    'educação': 'Curso, Livro, Mensalidade...',
    'assinatura': 'Spotify, Prime, Adobe...',
    'salário': 'Salário mensal, Pagamento...',
    'freelance': 'Projeto, Consultoria...',
    'investimento': 'Dividendos, Rendimento...',
  }
  return placeholders[cat] ?? `${selectedCategory.value.name}...`
})

// ── Date shortcuts ───────────────────────────────────────────────────────────
const todayStr = toISODate(new Date())
const yesterdayDate = new Date()
yesterdayDate.setDate(yesterdayDate.getDate() - 1)
const yesterdayStr = toISODate(yesterdayDate)

const dateShortcut = computed(() => {
  if (form.transaction_date === todayStr) return 'today'
  if (form.transaction_date === yesterdayStr) return 'yesterday'
  return 'custom'
})

// ── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  expense: {
    label: 'Despesa',
    icon: TrendingDown,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/15 text-destructive',
    activeBg: 'bg-destructive/15',
    saveBg: 'bg-destructive',
    saveText: 'Salvar Despesa',
    amountColor: 'text-destructive',
    pillBg: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
  },
  income: {
    label: 'Receita',
    icon: TrendingUp,
    colorClass: 'text-success',
    bgClass: 'bg-success/15 text-success',
    activeBg: 'bg-success/15',
    saveBg: 'bg-success',
    saveText: 'Salvar Receita',
    amountColor: 'text-success',
    pillBg: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
  },
  transfer: {
    label: 'Transferência',
    icon: ArrowRightLeft,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted text-foreground',
    activeBg: 'bg-muted',
    saveBg: 'bg-primary',
    saveText: 'Salvar Transferência',
    amountColor: 'text-foreground',
    pillBg: 'bg-muted/60 text-muted-foreground hover:bg-muted border-border/50',
  },
} as const

const typeConfig = computed(() => TYPE_CONFIG[form.type])

const submitLabel = computed(() => {
  if (props.transaction) return 'Salvar alterações'
  return typeConfig.value.saveText
})

const hasAmount = computed(() => {
  const v = parseFloat(form.amount.replace(',', '.'))
  return !isNaN(v) && v > 0
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (!store.categories.length) store.fetchCategories()
      if (!store.activeAccounts.length) store.fetchAccounts()
      if (!store.tags.length) store.fetchTags()
      if (props.transaction) fromTransaction(props.transaction)
      else {
        reset()
        if (props.prefill) {
          const p = props.prefill
          if (p.type) form.type = p.type
          if (p.description) form.description = p.description
          if (p.amount) form.amount = p.amount
          if (p.category_id) form.category_id = p.category_id
          if (p.account_id) form.account_id = p.account_id
        }
        if (!form.account_id && store.activeAccounts.length > 0) {
          form.account_id = store.activeAccounts[0].id
        }
      }
      nextTick(() => setTimeout(() => amountInputRef.value?.focus(), 150))
    }
  },
)

watch(
  () => form.type,
  (newType) => {
    form.category_id = ''
    categoryDropdownOpen.value = false
    if (newType !== 'transfer') form.destination_account_id = ''
    if (newType === 'transfer') form.total_installments = 0
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!validate()) return
  if (props.transaction && isEditingRecurring.value) {
    scopeDialogOpen.value = true
    return
  }
  await doSubmit()
}

async function handleScopeConfirm(scope: RecurrenceUpdateScope) {
  await doSubmit(scope)
}

async function doSubmit(scope?: RecurrenceUpdateScope) {
  submitting.value = true
  try {
    if (props.transaction) {
      const payload = scope ? { ...toPayload(), scope } : toPayload()
      const updated = await store.updateTransaction(props.transaction.id, payload)
      emit('updated', updated)
      toast.success('Transação atualizada')
    } else {
      const created = await store.createTransaction(toPayload())
      emit('created', created)
      toast.success('Transação registrada')
      if ('vibrate' in navigator) navigator.vibrate(50)
    }
    close()
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 422) {
      applyApiErrors(err.response.data?.errors ?? {})
      toast.error('Verifique os campos do formulário')
    } else {
      toast.error('Erro ao salvar transação')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-lg border-t border-border bg-background p-0 max-h-[95vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- ── Sticky header ──────────────────────────────── -->
      <div class="sticky top-0 bg-background z-10 shrink-0">

        <!-- Title row -->
        <div class="flex items-center gap-2 px-4 pt-3 pb-3">
          <button
            type="button"
            class="p-1.5 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
            @click="close"
          >
            <ArrowLeft :size="18" />
          </button>
          <h2 class="text-[15px] font-semibold leading-none">
            {{ transaction ? 'Editar transação' : 'Nova transação' }}
          </h2>
        </div>

        <!-- ── Type tabs — underline style ───────────────── -->
        <div class="flex px-4 border-b border-border/30">
          <button
            v-for="([t, cfg]) in (Object.entries(TYPE_CONFIG) as [TransactionType, typeof TYPE_CONFIG[TransactionType]][])"
            :key="t"
            type="button"
            class="relative flex-1 h-9 text-[13px] font-medium transition-colors"
            :class="form.type === t
              ? (t === 'expense' ? 'text-destructive' : t === 'income' ? 'text-success' : 'text-muted-foreground')
              : 'text-muted-foreground/40 hover:text-muted-foreground/70'"
            @click="form.type = t"
          >
            {{ cfg.label }}
            <span
              v-if="form.type === t"
              class="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
              :class="t === 'expense' ? 'bg-destructive' : t === 'income' ? 'bg-success' : 'bg-muted-foreground/50'"
            />
          </button>
        </div>
      </div>

      <!-- ── Scrollable body ──────────────────────────────── -->
      <form class="flex-1 overflow-y-auto" @submit.prevent="submit">
        <div class="px-4 pt-5 pb-3 space-y-5">

          <!-- ── VALOR ────────────────────────────────────── -->
          <div class="text-center">
            <div class="flex items-center justify-center gap-1.5 mb-3">
              <span class="text-[18px] font-medium text-muted-foreground">R$</span>
              <input
                ref="amountInputRef"
                v-model="form.amount"
                inputmode="decimal"
                placeholder="0,00"
                class="bg-transparent outline-none text-[40px] font-semibold tabular-nums w-auto max-w-[220px] text-center text-foreground placeholder:text-muted-foreground/20"
                size="8"
              />
            </div>
            <p v-if="errors.amount" class="text-xs text-destructive mb-2">{{ errors.amount }}</p>
            <!-- Quick increments — subtle glass -->
            <div class="flex gap-1.5 justify-center">
              <button
                v-for="inc in QUICK_INCREMENTS"
                :key="inc"
                type="button"
                class="h-7 px-2.5 rounded-md text-[12px] text-muted-foreground border border-white/10 bg-white/5 transition-all active:scale-95 hover:bg-white/10 hover:text-foreground"
                @click="addAmount(inc)"
              >
                +{{ inc }}
              </button>
            </div>
          </div>

          <!-- ── CATEGORIA — select field ─────────────────── -->
          <div v-if="form.type !== 'transfer'">
            <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
              Categoria
            </p>

            <!-- Trigger -->
            <button
              type="button"
              class="w-full h-11 rounded-lg px-3 flex items-center gap-2.5 text-left bg-card border border-white/10 transition-colors hover:border-white/15"
              @click="categoryDropdownOpen = !categoryDropdownOpen"
            >
              <template v-if="selectedCategory">
                <span
                  class="flex items-center justify-center size-5 rounded shrink-0"
                  :style="{ background: selectedCategory.color + '30', color: selectedCategory.color }"
                >
                  <component
                    v-if="selectedCategory.icon && findIcon(selectedCategory.icon)"
                    :is="findIcon(selectedCategory.icon)!.component"
                    :size="12"
                  />
                  <span v-else class="text-[9px] font-bold">{{ selectedCategory.name.charAt(0) }}</span>
                </span>
                <span class="flex-1 text-sm text-foreground truncate">{{ selectedCategory.name }}</span>
                <button
                  type="button"
                  class="text-muted-foreground/40 hover:text-muted-foreground shrink-0 -mr-0.5 p-1"
                  @click.stop="form.category_id = ''"
                >
                  <X :size="11" />
                </button>
              </template>
              <span v-else class="flex-1 text-sm text-muted-foreground/30">Selecionar categoria</span>
              <ChevronDown
                :size="14"
                class="text-muted-foreground shrink-0 transition-transform duration-200"
                :class="categoryDropdownOpen ? 'rotate-180' : ''"
              />
            </button>

            <!-- Inline dropdown -->
            <div
              v-if="categoryDropdownOpen"
              class="mt-1 rounded-lg overflow-hidden bg-popover border border-white/10"
            >
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                class="w-full flex items-center gap-2.5 px-3 h-11 text-left transition-colors border-b border-white/5 last:border-0"
                :class="form.category_id === cat.id ? 'bg-white/5' : 'hover:bg-white/5'"
                @click="form.category_id = cat.id; categoryDropdownOpen = false"
              >
                <span
                  class="flex items-center justify-center size-7 rounded shrink-0"
                  :style="{ background: cat.color + '30', color: cat.color }"
                >
                  <component
                    v-if="cat.icon && findIcon(cat.icon)"
                    :is="findIcon(cat.icon)!.component"
                    :size="14"
                  />
                  <span v-else class="text-xs font-bold">{{ cat.name.charAt(0) }}</span>
                </span>
                <span class="flex-1 text-sm text-foreground">{{ cat.name }}</span>
                <Check v-if="form.category_id === cat.id" :size="13" class="text-primary shrink-0" />
              </button>
              <!-- + Nova categoria -->
              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-3 h-11 text-left transition-colors hover:bg-white/5 border-t border-white/5"
                @click="showCategorySheet = true; categoryDropdownOpen = false"
              >
                <span class="flex items-center justify-center size-7 rounded text-muted-foreground">
                  <Plus :size="14" />
                </span>
                <span class="text-sm text-muted-foreground">Nova categoria</span>
              </button>
            </div>
          </div>

          <!-- Category quick-create sheet -->
          <CategoryQuickCreateSheet
            v-model:open="showCategorySheet"
            :default-type="form.type !== 'transfer' ? form.type : 'expense'"
            @created="(cat) => { form.category_id = cat.id; categoryDropdownOpen = false }"
          />

          <!-- ── TÍTULO ────────────────────────────────────── -->
          <div>
            <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
              Título
            </p>
            <input
              v-model="form.description"
              :placeholder="descriptionPlaceholder"
              class="w-full h-11 rounded-lg px-3 text-sm text-foreground bg-card border border-white/10 outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
            />
            <p v-if="errors.description" class="text-xs text-destructive mt-1">{{ errors.description }}</p>
          </div>

          <!-- ── DATA ─────────────────────────────────────── -->
          <div>
            <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
              Data
            </p>
            <!-- Date shortcut pills — neutral always -->
            <div class="flex gap-1.5 mb-2">
              <button
                type="button"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="dateShortcut === 'today' ? 'bg-white/10 border-white/20 text-foreground' : 'bg-white/5 border-white/8 text-muted-foreground'"
                @click="form.transaction_date = todayStr"
              >
                Hoje
              </button>
              <button
                type="button"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="dateShortcut === 'yesterday' ? 'bg-white/10 border-white/20 text-foreground' : 'bg-white/5 border-white/8 text-muted-foreground'"
                @click="form.transaction_date = yesterdayStr"
              >
                Ontem
              </button>
              <span
                class="h-8 px-3 rounded-md text-[11px] font-medium border flex items-center transition-all"
                :class="dateShortcut === 'custom' ? 'bg-white/10 border-white/20 text-foreground' : 'bg-white/5 border-white/8 text-muted-foreground/40'"
              >
                Personalizado
              </span>
            </div>
            <DatePicker v-model="form.transaction_date" />
            <p v-if="errors.transaction_date" class="text-xs text-destructive mt-1">{{ errors.transaction_date }}</p>
          </div>

          <!-- ── CONTA(S) ──────────────────────────────────── -->
          <div v-if="store.activeAccounts.length === 0" class="flex flex-col items-center justify-center gap-2 py-5 rounded-lg border border-dashed border-white/10 text-center">
            <Wallet :size="22" class="text-muted-foreground/40" />
            <p class="text-[12px] text-muted-foreground/50">Nenhuma conta cadastrada</p>
          </div>

          <template v-else-if="form.type === 'transfer'">
            <!-- Origin account -->
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
                Conta de origem <span class="text-destructive">*</span>
              </p>
              <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  v-for="acc in store.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === form.destination_account_id"
                  class="flex-shrink-0 flex items-center gap-2 h-11 px-3 rounded-lg border text-left transition-all disabled:cursor-not-allowed"
                  :class="form.account_id === acc.id
                    ? 'border-white/25 bg-white/5'
                    : 'border-white/8 bg-card opacity-50 hover:opacity-80'"
                  @click="form.account_id = form.account_id === acc.id ? '' : acc.id"
                >
                  <span
                    class="flex items-center justify-center size-7 rounded shrink-0 text-xs font-bold text-white"
                    :style="{ background: acc.color ?? '#6b7280' }"
                  >
                    {{ acc.name.charAt(0) }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-[12px] font-medium text-foreground leading-none">{{ acc.name }}</p>
                    <p class="text-[10px] text-muted-foreground mt-0.5 leading-none">{{ acc.type }}</p>
                  </div>
                </button>
              </div>
              <p v-if="errors.account_id" class="text-xs text-destructive mt-1">{{ errors.account_id }}</p>
            </div>

            <!-- Destination account -->
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
                Conta de destino <span class="text-destructive">*</span>
              </p>
              <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  v-for="acc in store.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === form.account_id"
                  class="flex-shrink-0 flex items-center gap-2 h-11 px-3 rounded-lg border text-left transition-all disabled:cursor-not-allowed"
                  :class="form.destination_account_id === acc.id
                    ? 'border-white/25 bg-white/5'
                    : 'border-white/8 bg-card opacity-50 hover:opacity-80'"
                  @click="form.destination_account_id = form.destination_account_id === acc.id ? '' : acc.id"
                >
                  <span
                    class="flex items-center justify-center size-7 rounded shrink-0 text-xs font-bold text-white"
                    :style="{ background: acc.color ?? '#6b7280' }"
                  >
                    {{ acc.name.charAt(0) }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-[12px] font-medium text-foreground leading-none">{{ acc.name }}</p>
                    <p class="text-[10px] text-muted-foreground mt-0.5 leading-none">{{ acc.type }}</p>
                  </div>
                </button>
              </div>
              <p v-if="errors.destination_account_id" class="text-xs text-destructive mt-1">{{ errors.destination_account_id }}</p>
            </div>
          </template>

          <!-- Single account for income/expense -->
          <div v-else>
            <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
              Conta <span class="text-destructive">*</span>
            </p>
            <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                type="button"
                class="flex-shrink-0 flex items-center gap-2 h-11 px-3 rounded-lg border text-left transition-all"
                :class="form.account_id === acc.id
                  ? 'border-white/25 bg-white/5'
                  : 'border-white/8 bg-card opacity-50 hover:opacity-80'"
                @click="form.account_id = form.account_id === acc.id ? '' : acc.id"
              >
                <span
                  class="flex items-center justify-center size-7 rounded shrink-0 text-xs font-bold text-white"
                  :style="{ background: acc.color ?? '#6b7280' }"
                >
                  {{ acc.name.charAt(0) }}
                </span>
                <div class="min-w-0">
                  <p class="text-[12px] font-medium text-foreground leading-none">{{ acc.name }}</p>
                  <p class="text-[10px] text-muted-foreground mt-0.5 leading-none">{{ acc.type }}</p>
                </div>
              </button>
            </div>
            <p v-if="errors.account_id" class="text-xs text-destructive mt-1">{{ errors.account_id }}</p>
          </div>

          <!-- ── TRANSAÇÃO FIXA — compact card ─────────────── -->
          <div v-if="form.type !== 'transfer'">
            <div
              class="flex items-center gap-3 h-12 rounded-lg px-3 border border-white/8 bg-card cursor-pointer"
              @click="form.is_recurring = !form.is_recurring; if (form.is_recurring) form.total_installments = 0"
            >
              <Repeat :size="16" class="text-muted-foreground shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-foreground leading-none">Transação fixa</p>
                <p class="text-[11px] text-muted-foreground mt-0.5 leading-none">
                  {{ form.is_recurring ? ('A cada ' + (FREQ_LABELS[form.recurrence_frequency] ?? 'mês')) : 'Repete periodicamente' }}
                </p>
              </div>
              <!-- Toggle — only this changes color -->
              <button
                type="button"
                class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
                :class="form.is_recurring ? 'bg-primary' : 'bg-muted'"
                @click.stop="form.is_recurring = !form.is_recurring; if (form.is_recurring) form.total_installments = 0"
              >
                <span
                  class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                  :class="form.is_recurring ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Recurrence expanded config -->
            <div v-if="form.is_recurring" class="mt-1 rounded-lg border border-white/8 bg-card px-3.5 pb-3.5 pt-3 space-y-3">
              <!-- Frequency pills -->
              <div>
                <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">Frequência</p>
                <div class="flex gap-1.5 flex-wrap">
                  <button
                    v-for="opt in FREQUENCY_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="h-8 px-2.5 rounded-md text-[11px] font-medium border transition-all"
                    :class="form.recurrence_frequency === opt.value
                      ? 'bg-white/10 border-white/20 text-foreground'
                      : 'bg-white/5 border-white/8 text-muted-foreground hover:text-foreground'"
                    @click="form.recurrence_frequency = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <!-- End condition -->
              <div>
                <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">Término</p>
                <div class="space-y-2">
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" :checked="form.recurrence_end_type === 'never'" class="accent-primary" @change="form.recurrence_end_type = 'never'" />
                    <span class="text-[12px]">Sem data de término</span>
                  </label>
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" :checked="form.recurrence_end_type === 'count'" class="accent-primary" @change="form.recurrence_end_type = 'count'" />
                    <span class="text-[12px]">Após</span>
                    <input
                      v-model.number="form.recurrence_count"
                      type="number"
                      inputmode="numeric"
                      min="2"
                      max="260"
                      class="w-16 h-7 px-2 rounded bg-background border border-white/10 text-[12px] text-center outline-none focus:border-primary tabular-nums"
                      @focus="form.recurrence_end_type = 'count'"
                    />
                    <span class="text-[12px] text-muted-foreground">ocorrências</span>
                  </label>
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" :checked="form.recurrence_end_type === 'date'" class="accent-primary" @change="form.recurrence_end_type = 'date'" />
                    <span class="text-[12px]">Em uma data</span>
                    <input
                      v-model="form.recurrence_end_date"
                      type="date"
                      class="flex-1 h-7 px-2 rounded bg-background border border-white/10 text-[12px] outline-none focus:border-primary"
                      @focus="form.recurrence_end_type = 'date'"
                    />
                  </label>
                </div>
              </div>

              <!-- Preview -->
              <p class="text-[11px] text-muted-foreground/70 leading-relaxed">
                A cada <strong class="text-foreground">{{ FREQ_LABELS[form.recurrence_frequency] ?? 'mês' }}</strong>
                <template v-if="nextOccurrenceLabel"> · próxima em <strong class="text-foreground">{{ nextOccurrenceLabel }}</strong></template>
                <template v-if="form.recurrence_end_type === 'count'"> · por <strong class="text-foreground">{{ form.recurrence_count }} ocorrências</strong></template>
                <template v-else-if="form.recurrence_end_type === 'date' && form.recurrence_end_date"> · até <strong class="text-foreground">{{ new Date(form.recurrence_end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) }}</strong></template>
                <template v-else> · sem data de término</template>
              </p>
            </div>
          </div>

          <!-- ── COMPRA PARCELADA — compact card ──────────── -->
          <div v-if="form.type !== 'transfer' && !props.transaction">
            <div
              class="flex items-center gap-3 h-12 rounded-lg px-3 border border-white/8 bg-card cursor-pointer"
              @click="toggleInstallments(form.total_installments >= 2 ? 0 : 2)"
            >
              <CreditCard :size="16" class="text-muted-foreground shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-foreground leading-none">Compra parcelada</p>
                <p class="text-[11px] text-muted-foreground mt-0.5 leading-none">
                  <template v-if="isInstallment && installmentAmount > 0">
                    {{ form.total_installments }}x de R$ {{ installmentAmount.toFixed(2).replace('.', ',') }}
                  </template>
                  <template v-else>Dividir em parcelas mensais</template>
                </p>
              </div>
              <!-- Toggle — only this changes color -->
              <button
                type="button"
                class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
                :class="isInstallment ? 'bg-primary' : 'bg-muted'"
                @click.stop="toggleInstallments(form.total_installments >= 2 ? 0 : 2)"
              >
                <span
                  class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                  :class="isInstallment ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Installment count pills -->
            <div v-if="isInstallment" class="mt-1 rounded-lg border border-white/8 bg-card p-3">
              <div class="flex gap-1.5 flex-wrap mb-2.5">
                <button
                  v-for="n in INSTALLMENT_OPTIONS"
                  :key="n"
                  type="button"
                  class="h-8 px-3 rounded-md text-[12px] font-medium border transition-all"
                  :class="form.total_installments === n
                    ? 'bg-white/10 border-white/20 text-foreground'
                    : 'bg-white/5 border-white/8 text-muted-foreground hover:text-foreground'"
                  @click="form.total_installments = n"
                >
                  {{ n }}x
                </button>
              </div>
              <div v-if="installmentAmount > 0" class="flex items-center justify-between text-[11px]">
                <span class="text-muted-foreground">{{ form.total_installments }} parcelas de</span>
                <span class="tabular-nums font-semibold text-foreground">
                  R$ {{ installmentAmount.toFixed(2).replace('.', ',') }}
                </span>
              </div>
            </div>
          </div>

          <!-- ── TAGS ─────────────────────────────────────── -->
          <div v-if="store.tags.length > 0 || true">
            <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
              Tags
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="tag in store.tags"
                :key="tag.id"
                type="button"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium border transition-all"
                :class="form.tag_ids.includes(tag.id)
                  ? 'border-transparent text-white'
                  : 'border-white/10 text-muted-foreground bg-card hover:text-foreground'"
                :style="form.tag_ids.includes(tag.id) ? { background: tag.color } : {}"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
                <X v-if="form.tag_ids.includes(tag.id)" :size="9" :stroke-width="2.5" />
              </button>

              <!-- Inline create -->
              <div class="inline-flex items-center h-7 rounded-md border border-dashed border-white/10 overflow-hidden bg-card">
                <input
                  v-model="newTagName"
                  placeholder="Nova tag..."
                  class="bg-transparent text-[11px] pl-2.5 pr-1 outline-none text-muted-foreground w-20 placeholder:text-muted-foreground/30"
                  @keydown.enter.prevent="createInlineTag"
                />
                <button
                  type="button"
                  class="h-full px-2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  :disabled="creatingTag || !newTagName.trim()"
                  @click="createInlineTag"
                >
                  <Loader2 v-if="creatingTag" :size="10" class="animate-spin" />
                  <Plus v-else :size="10" :stroke-width="2.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- ── OBSERVAÇÕES ────────────────────────────────── -->
          <div>
            <p class="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-2">
              Observações
            </p>
            <div class="relative">
              <Textarea
                v-model="form.notes"
                placeholder="Detalhes extras, referência, contexto..."
                class="resize-none h-20 text-sm bg-card border-white/10 focus:border-primary rounded-lg pr-12 placeholder:text-muted-foreground/30"
              />
              <span class="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/30 tabular-nums">
                {{ form.notes?.length ?? 0 }}/500
              </span>
            </div>
          </div>

        </div>
      </form>

      <!-- ── Sticky footer — CTA ──────────────────────────── -->
      <div class="sticky bottom-0 bg-background px-4 pt-2 pb-5 shrink-0">
        <button
          type="button"
          class="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          :class="[(!isFormValid || submitting) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90']"
          :style="form.type === 'expense'
            ? 'background: #FF4D4D; color: #FFFFFF'
            : form.type === 'income'
            ? 'background: #00C896; color: #000000'
            : 'background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.15); color: #F0F0F0'"
          :disabled="submitting || !isFormValid"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          <span v-else>{{ submitLabel }}</span>
        </button>
      </div>

    </SheetContent>
  </Sheet>

  <!-- Recurring scope picker -->
  <RecurringEditScopeDialog
    v-model:open="scopeDialogOpen"
    @confirm="handleScopeConfirm"
  />
</template>
