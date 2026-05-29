<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import { Textarea } from '@ui/textarea'
import {
  ArrowLeft, Loader2, Plus, Repeat, X, CreditCard,
  TrendingDown, TrendingUp, ArrowRightLeft,
  CalendarCheck, Wallet, CheckCircle,
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

// ── Amount field ref for auto-focus ─────────────────────────────────────────
const amountInputRef = ref<HTMLInputElement | null>(null)

// ── Form validity ─────────────────────────────────────────────────────────────
const isFormValid = computed(() => {
  const parsed = parseFloat(form.amount.replace(',', '.'))
  const baseValid = form.description.trim().length > 0 && !isNaN(parsed) && parsed > 0 && !!form.account_id
  if (form.type === 'transfer') {
    return baseValid && !!form.destination_account_id && form.destination_account_id !== form.account_id
  }
  // Installment: must have a valid count selected
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
  { value: 'weekly',     label: 'Semanal' },
  { value: 'biweekly',  label: 'Quinzenal' },
  { value: 'monthly',   label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual',label: 'Semestral' },
  { value: 'annual',    label: 'Anual' },
] as const

const FREQ_LABELS: Record<string, string> = {
  weekly: 'semana', biweekly: 'quinzena', monthly: 'mês',
  bimonthly: '2 meses', quarterly: '3 meses', semiannual: '6 meses', annual: 'ano',
}

/** Next occurrence date from the transaction_date based on selected frequency */
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

/** Per-installment amount with rounding (1st installment absorbs the cent remainder). */
const installmentAmount = computed(() => {
  const total = parseFloat(form.amount.replace(',', '.'))
  if (!total || total <= 0 || !isInstallment.value) return 0
  return Math.floor((total / form.total_installments) * 100) / 100
})

function toggleInstallments(n: number) {
  if (form.total_installments === n) {
    form.total_installments = 0 // deselect
  } else {
    form.total_installments = n
    form.is_recurring = false // mutually exclusive
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

// Dynamic description placeholder based on selected category
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
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/15 text-violet-400',
    activeBg: 'bg-violet-500/15',
    saveBg: 'bg-violet-500',
    saveText: 'Salvar Transferência',
    amountColor: 'text-violet-400',
    pillBg: 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border-violet-500/20',
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
        // Auto-select the first account so the save button is immediately usable
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
    // Clear destination account when switching away from transfer
    if (newType !== 'transfer') form.destination_account_id = ''
    // Installments only for expense/income (not transfer)
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
      class="rounded-t-2xl border-t border-border bg-card p-0 max-h-[95vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="sticky top-0 bg-card z-10 px-4 pt-3 pb-0 shrink-0">
        <div class="flex items-center gap-2 mb-3">
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-muted transition-colors -ml-1 text-muted-foreground"
            @click="close"
          >
            <ArrowLeft :size="18" />
          </button>
          <div class="flex-1">
            <h2 class="text-[15px] font-semibold leading-none">
              {{ transaction ? 'Editar transação' : 'Nova transação' }}
            </h2>
            <p class="text-[11px] mt-0.5" :class="typeConfig.colorClass">
              {{ typeConfig.label }}
            </p>
          </div>
        </div>

        <!-- ── Type selector — 3 pills ─────────────────────────── -->
        <div class="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-xl mb-4">
          <button
            v-for="([t, cfg]) in (Object.entries(TYPE_CONFIG) as [TransactionType, typeof TYPE_CONFIG[TransactionType]][])"
            :key="t"
            type="button"
            class="flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-semibold transition-all"
            :class="form.type === t
              ? `${cfg.bgClass} shadow-sm`
              : 'text-muted-foreground/60 hover:text-muted-foreground'"
            @click="form.type = t"
          >
            <component :is="cfg.icon" :size="13" />
            {{ cfg.label }}
          </button>
        </div>
      </div>

      <!-- ── Scrollable body ───────────────────────────────────── -->
      <form class="flex-1 overflow-y-auto" @submit.prevent="submit">
        <div class="px-4 pb-3 space-y-5">

          <!-- ── VALOR — hero element ─────────────────────────── -->
          <div class="text-center pt-1">
            <div class="flex items-center justify-center gap-2 mb-3">
              <span
                class="text-xl font-semibold transition-colors"
                :class="hasAmount ? typeConfig.colorClass : 'text-muted-foreground/30'"
              >R$</span>
              <input
                ref="amountInputRef"
                v-model="form.amount"
                inputmode="decimal"
                placeholder="0,00"
                class="bg-transparent outline-none text-5xl font-bold tabular-nums w-auto max-w-[200px] text-center transition-colors"
                :class="hasAmount ? typeConfig.amountColor : 'text-muted-foreground/20 placeholder:text-muted-foreground/20'"
                size="8"
              />
            </div>
            <p v-if="errors.amount" class="text-xs text-destructive mb-2">{{ errors.amount }}</p>
            <!-- Quick increments — themed by type -->
            <div class="flex gap-1.5 justify-center">
              <button
                v-for="inc in QUICK_INCREMENTS"
                :key="inc"
                type="button"
                class="h-7 px-3 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
                :class="typeConfig.pillBg"
                @click="addAmount(inc)"
              >
                +{{ inc }}
              </button>
            </div>
          </div>

          <!-- ── CATEGORIA — principal visual after value ──────── -->
          <div v-if="form.type !== 'transfer'">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2.5">
              Categoria
            </p>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                class="flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-3 px-1 text-[11px] font-medium leading-tight transition-all active:scale-95"
                :class="form.category_id === cat.id
                  ? 'border-2 shadow-sm'
                  : 'border-border/40 text-muted-foreground hover:border-border/80 hover:bg-muted/40'"
                :style="form.category_id === cat.id
                  ? { borderColor: cat.color, background: cat.color + '18', color: cat.color }
                  : {}"
                @click="form.category_id = form.category_id === cat.id ? '' : cat.id"
              >
                <span
                  class="flex items-center justify-center size-9 rounded-xl"
                  :style="{ backgroundColor: cat.color + '25', color: cat.color }"
                >
                  <component
                    v-if="cat.icon && findIcon(cat.icon)"
                    :is="findIcon(cat.icon)!.component"
                    :size="18"
                    :stroke-width="1.8"
                  />
                  <span v-else class="text-sm font-bold">{{ cat.name.charAt(0) }}</span>
                </span>
                <span class="truncate w-full text-center text-[10.5px]">{{ cat.name }}</span>
              </button>

              <!-- "+ Nova" button — always last in the grid -->
              <button
                type="button"
                class="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/50 py-3 px-1 text-[11px] font-medium text-muted-foreground/60 hover:border-border hover:text-muted-foreground hover:bg-muted/30 transition-all active:scale-95"
                @click="showCategorySheet = true"
              >
                <span class="flex items-center justify-center size-9 rounded-xl bg-muted/40">
                  <Plus :size="18" :stroke-width="1.8" />
                </span>
                <span class="text-[10.5px]">Nova</span>
              </button>
            </div>
          </div>

          <!-- Category quick-create sheet -->
          <CategoryQuickCreateSheet
            v-model:open="showCategorySheet"
            :default-type="form.type !== 'transfer' ? form.type : 'expense'"
            @created="(cat) => { form.category_id = cat.id }"
          />

          <!-- ── TÍTULO ─────────────────────────────────────────── -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
              Título
            </p>
            <div class="relative">
              <!-- Icon from selected category (or generic) -->
              <span
                class="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center size-5 rounded-md"
                :style="selectedCategory
                  ? { color: selectedCategory.color }
                  : {}"
              >
                <component
                  v-if="selectedCategory?.icon && findIcon(selectedCategory.icon)"
                  :is="findIcon(selectedCategory.icon)!.component"
                  :size="14"
                />
                <span v-else-if="selectedCategory" class="text-xs font-bold" :style="{ color: selectedCategory.color }">
                  {{ selectedCategory.name.charAt(0) }}
                </span>
              </span>
              <input
                v-model="form.description"
                :placeholder="descriptionPlaceholder"
                class="w-full h-12 rounded-2xl bg-muted/60 border border-border/40 focus:border-border/80 outline-none text-sm transition-colors"
                :class="selectedCategory ? 'pl-10 pr-4' : 'px-4'"
              />
            </div>
            <p v-if="errors.description" class="text-xs text-destructive mt-1">{{ errors.description }}</p>
          </div>

          <!-- ── DATA ───────────────────────────────────────────── -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
              Data
            </p>
            <!-- Quick date pills -->
            <div class="flex gap-1.5 mb-2">
              <button
                type="button"
                class="flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-semibold border transition-all"
                :class="dateShortcut === 'today'
                  ? `${typeConfig.bgClass} border-transparent`
                  : 'border-border/50 text-muted-foreground hover:bg-muted'"
                @click="form.transaction_date = todayStr"
              >
                <CalendarCheck :size="11" />
                Hoje
              </button>
              <button
                type="button"
                class="h-7 px-3 rounded-full text-[11px] font-semibold border transition-all"
                :class="dateShortcut === 'yesterday'
                  ? `${typeConfig.bgClass} border-transparent`
                  : 'border-border/50 text-muted-foreground hover:bg-muted'"
                @click="form.transaction_date = yesterdayStr"
              >
                Ontem
              </button>
              <span
                class="h-7 px-3 rounded-full text-[11px] font-semibold border flex items-center"
                :class="dateShortcut === 'custom'
                  ? `${typeConfig.bgClass} border-transparent`
                  : 'border-border/50 text-muted-foreground/40'"
              >
                Personalizado
              </span>
            </div>
            <DatePicker v-model="form.transaction_date" />
            <p v-if="errors.transaction_date" class="text-xs text-destructive mt-1">{{ errors.transaction_date }}</p>
          </div>

          <!-- ── CONTA(S) ──────────────────────────────────────────── -->
          <!-- For transfers: two separate selectors (origin and destination) -->
          <!-- For income/expense: single account selector -->

          <div v-if="store.activeAccounts.length === 0" class="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border border-dashed border-border/50 text-center">
            <Wallet :size="22" class="text-muted-foreground/40" />
            <p class="text-[12px] text-muted-foreground/50">Nenhuma conta cadastrada</p>
          </div>

          <template v-else-if="form.type === 'transfer'">
            <!-- Origin account -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Conta de origem <span class="text-destructive">*</span>
              </p>
              <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  v-for="acc in store.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === form.destination_account_id"
                  class="flex-shrink-0 flex items-center gap-2.5 h-12 pl-3 pr-4 rounded-2xl border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  :class="form.account_id === acc.id
                    ? 'bg-destructive/15 text-destructive border-transparent shadow-sm'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60'"
                  @click="form.account_id = form.account_id === acc.id ? '' : acc.id"
                >
                  <span class="flex items-center justify-center size-7 rounded-xl text-xs font-bold uppercase shrink-0"
                    :class="form.account_id === acc.id ? 'bg-background/20 text-current' : 'bg-muted text-foreground'">
                    {{ acc.name.charAt(0) }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-[12px] font-semibold leading-none">{{ acc.name }}</p>
                    <p class="text-[10px] opacity-60 mt-0.5 leading-none">{{ acc.type }}</p>
                  </div>
                </button>
              </div>
              <p v-if="errors.account_id" class="text-xs text-destructive mt-1">{{ errors.account_id }}</p>
            </div>

            <!-- Destination account -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Conta de destino <span class="text-destructive">*</span>
              </p>
              <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  v-for="acc in store.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === form.account_id"
                  class="flex-shrink-0 flex items-center gap-2.5 h-12 pl-3 pr-4 rounded-2xl border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  :class="form.destination_account_id === acc.id
                    ? 'bg-success/15 text-success border-transparent shadow-sm'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60'"
                  @click="form.destination_account_id = form.destination_account_id === acc.id ? '' : acc.id"
                >
                  <span class="flex items-center justify-center size-7 rounded-xl text-xs font-bold uppercase shrink-0"
                    :class="form.destination_account_id === acc.id ? 'bg-background/20 text-current' : 'bg-muted text-foreground'">
                    {{ acc.name.charAt(0) }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-[12px] font-semibold leading-none">{{ acc.name }}</p>
                    <p class="text-[10px] opacity-60 mt-0.5 leading-none">{{ acc.type }}</p>
                  </div>
                </button>
              </div>
              <p v-if="errors.destination_account_id" class="text-xs text-destructive mt-1">{{ errors.destination_account_id }}</p>
            </div>
          </template>

          <!-- Single account for income/expense -->
          <div v-else>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
              Conta <span class="text-destructive">*</span>
            </p>
            <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                type="button"
                class="flex-shrink-0 flex items-center gap-2.5 h-12 pl-3 pr-4 rounded-2xl border text-left transition-all"
                :class="form.account_id === acc.id
                  ? `${typeConfig.bgClass} border-transparent shadow-sm`
                  : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60'"
                @click="form.account_id = form.account_id === acc.id ? '' : acc.id"
              >
                <span
                  class="flex items-center justify-center size-7 rounded-xl text-xs font-bold uppercase shrink-0"
                  :class="form.account_id === acc.id ? 'bg-background/20 text-current' : 'bg-muted text-foreground'"
                >
                  {{ acc.name.charAt(0) }}
                </span>
                <div class="min-w-0">
                  <p class="text-[12px] font-semibold leading-none">{{ acc.name }}</p>
                  <p class="text-[10px] opacity-60 mt-0.5 leading-none">{{ acc.type }}</p>
                </div>
              </button>
            </div>
            <p v-if="errors.account_id" class="text-xs text-destructive mt-1">{{ errors.account_id }}</p>
          </div>

          <!-- ── TAGS ───────────────────────────────────────────── -->
          <div v-if="store.tags.length > 0 || true">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
              Tags
            </p>
            <div class="flex flex-wrap gap-1.5">
              <!-- Existing tags -->
              <button
                v-for="tag in store.tags"
                :key="tag.id"
                type="button"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all active:scale-95"
                :class="form.tag_ids.includes(tag.id)
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border/50 text-muted-foreground hover:border-border bg-transparent'"
                :style="form.tag_ids.includes(tag.id) ? { background: tag.color } : {}"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
                <X v-if="form.tag_ids.includes(tag.id)" :size="9" :stroke-width="2.5" />
              </button>

              <!-- Inline create -->
              <div class="inline-flex items-center h-7 rounded-full border border-dashed border-border/50 overflow-hidden bg-muted/20">
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

          <!-- ── OBSERVAÇÕES ──────────────────────────────────────── -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
              Observações
            </p>
            <div class="relative">
              <Textarea
                v-model="form.notes"
                placeholder="Detalhes extras, referência, contexto..."
                class="resize-none h-20 text-sm bg-muted/40 border-border/40 focus:border-border/70 rounded-2xl pr-12"
              />
              <span class="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/30 tabular-nums">
                {{ form.notes?.length ?? 0 }}/500
              </span>
            </div>
          </div>

          <!-- ── TRANSAÇÃO FIX ─────────────────────────────────── -->
          <div
            v-if="form.type !== 'transfer'"
            class="rounded-2xl border border-border/40 bg-muted/20 transition-all"
            :class="form.is_recurring ? 'border-violet-500/30 bg-violet-500/5' : ''"
          >
            <!-- Toggle header -->
            <div
              class="flex items-center justify-between gap-4 p-3.5 cursor-pointer"
              @click="form.is_recurring = !form.is_recurring; if (form.is_recurring) form.total_installments = 0"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span
                  class="flex items-center justify-center size-9 rounded-xl shrink-0 transition-colors"
                  :class="form.is_recurring ? 'bg-violet-500/15 text-violet-400' : 'bg-muted text-muted-foreground/40'"
                >
                  <Repeat :size="15" />
                </span>
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold leading-none">Transação fixa</p>
                  <p class="text-[11px] text-muted-foreground/50 mt-0.5 leading-snug">
                    <template v-if="form.is_recurring">
                      A cada {{ FREQ_LABELS[form.recurrence_frequency] ?? 'mês' }}
                      <template v-if="nextOccurrenceLabel"> · próxima em {{ nextOccurrenceLabel }}</template>
                    </template>
                    <template v-else>Repete periodicamente</template>
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="h-6 w-11 rounded-full transition-all flex items-center px-0.5 shrink-0"
                :class="form.is_recurring ? 'bg-violet-500' : 'bg-muted'"
                @click.stop="form.is_recurring = !form.is_recurring; if (form.is_recurring) form.total_installments = 0"
              >
                <span
                  class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                  :class="form.is_recurring ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Recurrence config — shown when toggle is on -->
            <div v-if="form.is_recurring" class="border-t border-violet-500/20 px-3.5 pb-3.5 pt-3 space-y-3">
              <!-- Frequency pills -->
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Frequência</p>
                <div class="flex gap-1.5 flex-wrap">
                  <button
                    v-for="opt in FREQUENCY_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="h-7 px-2.5 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
                    :class="form.recurrence_frequency === opt.value
                      ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                      : 'border-border/50 text-muted-foreground hover:bg-muted'"
                    @click="form.recurrence_frequency = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <!-- End condition -->
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Término</p>
                <div class="space-y-2">
                  <!-- Never -->
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      :checked="form.recurrence_end_type === 'never'"
                      class="accent-violet-500"
                      @change="form.recurrence_end_type = 'never'"
                    />
                    <span class="text-[12px]">Sem data de término</span>
                  </label>

                  <!-- After N occurrences -->
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      :checked="form.recurrence_end_type === 'count'"
                      class="accent-violet-500"
                      @change="form.recurrence_end_type = 'count'"
                    />
                    <span class="text-[12px]">Após</span>
                    <input
                      v-model.number="form.recurrence_count"
                      type="number"
                      min="2"
                      max="260"
                      class="w-16 h-7 px-2 rounded-lg bg-muted border border-border/60 text-[12px] text-center outline-none focus:border-violet-500/50 tabular-nums"
                      @focus="form.recurrence_end_type = 'count'"
                    />
                    <span class="text-[12px] text-muted-foreground">ocorrências</span>
                  </label>

                  <!-- Until date -->
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      :checked="form.recurrence_end_type === 'date'"
                      class="accent-violet-500"
                      @change="form.recurrence_end_type = 'date'"
                    />
                    <span class="text-[12px]">Em uma data</span>
                    <input
                      v-model="form.recurrence_end_date"
                      type="date"
                      class="flex-1 h-7 px-2 rounded-lg bg-muted border border-border/60 text-[12px] outline-none focus:border-violet-500/50"
                      @focus="form.recurrence_end_type = 'date'"
                    />
                  </label>
                </div>
              </div>

              <!-- Preview -->
              <div class="rounded-xl bg-violet-500/8 border border-violet-500/20 px-3 py-2 text-[11px] text-violet-300/80 leading-relaxed">
                Será gerado a cada <strong>{{ FREQ_LABELS[form.recurrence_frequency] ?? 'mês' }}</strong>
                <template v-if="nextOccurrenceLabel"> · próxima em <strong>{{ nextOccurrenceLabel }}</strong></template>
                <template v-if="form.recurrence_end_type === 'count'"> · por <strong>{{ form.recurrence_count }} ocorrências</strong></template>
                <template v-else-if="form.recurrence_end_type === 'date' && form.recurrence_end_date"> · até <strong>{{ new Date(form.recurrence_end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) }}</strong></template>
                <template v-else> · sem data de término</template>
              </div>
            </div>
          </div>

          <!-- ── COMPRA PARCELADA ────────────────────────────────── -->
          <div
            v-if="form.type !== 'transfer' && !props.transaction"
            class="rounded-2xl border border-border/40 bg-muted/20 p-3.5 transition-all"
            :class="isInstallment ? 'border-blue-500/30 bg-blue-500/5' : ''"
          >
            <!-- Header row -->
            <div
              class="flex items-center justify-between gap-4 cursor-pointer"
              @click="toggleInstallments(form.total_installments >= 2 ? 0 : 2)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span
                  class="flex items-center justify-center size-9 rounded-xl shrink-0 transition-colors"
                  :class="isInstallment ? 'bg-blue-500/15 text-blue-400' : 'bg-muted text-muted-foreground/40'"
                >
                  <CreditCard :size="15" />
                </span>
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold leading-none">Compra parcelada</p>
                  <p class="text-[11px] text-muted-foreground/50 mt-0.5 leading-snug">
                    <template v-if="isInstallment && installmentAmount > 0">
                      <span class="text-blue-400 font-semibold">
                        {{ form.total_installments }}x de {{ $filters?.formatCurrency?.(installmentAmount) ?? `R$ ${installmentAmount.toFixed(2).replace('.', ',')}` }}
                      </span>
                    </template>
                    <template v-else>Dividir em parcelas mensais</template>
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="h-6 w-11 rounded-full transition-all flex items-center px-0.5 shrink-0"
                :class="isInstallment ? 'bg-blue-500' : 'bg-muted'"
                @click.stop="toggleInstallments(form.total_installments >= 2 ? 0 : 2)"
              >
                <span
                  class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                  :class="isInstallment ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Installment count pills -->
            <div v-if="isInstallment" class="mt-3 flex gap-1.5 flex-wrap">
              <button
                v-for="n in INSTALLMENT_OPTIONS"
                :key="n"
                type="button"
                class="h-8 px-3 rounded-full text-[12px] font-semibold border transition-all active:scale-95"
                :class="form.total_installments === n
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'border-border/50 text-muted-foreground hover:bg-muted'"
                @click="form.total_installments = n"
              >
                {{ n }}x
              </button>
            </div>

            <!-- Preview of per-installment amount -->
            <div
              v-if="isInstallment && installmentAmount > 0"
              class="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground/60"
            >
              <span>{{ form.total_installments }} parcelas de</span>
              <span class="tabular-nums font-semibold text-blue-400">
                R$ {{ installmentAmount.toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>

        </div>
      </form>

      <!-- ── Sticky footer — CTA ──────────────────────────────── -->
      <div class="sticky bottom-0 bg-card px-4 pt-2 pb-5 shrink-0">
        <button
          type="button"
          class="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          :class="[
            typeConfig.saveBg,
            'text-white',
            (!isFormValid || submitting) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90',
          ]"
          :disabled="submitting || !isFormValid"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="18" class="animate-spin" />
          <template v-else>
            <CheckCircle :size="18" :stroke-width="2.5" />
            {{ submitLabel }}
          </template>
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
