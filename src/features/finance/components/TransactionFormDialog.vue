<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import { Textarea } from '@ui/textarea'
import {
  ArrowLeft, Loader2, Plus, Repeat, X, CreditCard,
  TrendingDown, TrendingUp, ArrowRightLeft,
  Wallet, Check,
} from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import CategoryQuickCreateSheet from './CategoryQuickCreateSheet.vue'
import { ACCOUNT_TYPE_LABELS } from '@/types/finance'
import type { Transaction, TransactionType, RecurrenceUpdateScope } from '@/types/finance'
import { useTransactionForm } from '../composables/useTransactionForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { toISODate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { getContrastColor } from '@/utils/color'
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
  const next = current + inc
  form.amount = next.toFixed(2).replace('.', ',')
  if (amountInputRef.value) {
    amountInputRef.value.value = formatAmountDisplay(Math.round(next * 100).toString())
  }
}

// ── Currency mask — centavos style ───────────────────────────────────────────
function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function onAmountInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  form.amount = digits ? (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',') : ''
  ;(e.target as HTMLInputElement).value = formatAmountDisplay(digits)
}

function onAmountFocus(e: Event) {
  const input = e.target as HTMLInputElement
  setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0)
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
  return Math.round((total / form.total_installments) * 100) / 100
})

const lastInstallmentAmount = computed(() => {
  const total = parseFloat(form.amount.replace(',', '.'))
  if (!total || total <= 0 || !isInstallment.value || form.total_installments < 2) return 0
  return Math.round((total - installmentAmount.value * (form.total_installments - 1)) * 100) / 100
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
          form.account_id = store.activeAccounts[0]?.id ?? ''
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
      const result = await store.createTransaction(toPayload())
      const created = Array.isArray(result) ? result[0]! : result
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
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[95vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- ── Sticky header ──────────────────────────────── -->
      <div class="sticky top-0 z-10 shrink-0 bg-background">

        <!-- Title row -->
        <div class="flex items-center gap-2 px-4 pt-3 pb-2">
          <button
            type="button"
            class="p-1.5 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
            @click="close"
          >
            <ArrowLeft :size="18" />
          </button>
          <div>
            <h2 class="text-[17px] font-semibold leading-none">
              {{ transaction ? 'Editar transação' : 'Nova transação' }}
            </h2>
            <p
              class="text-[13px] font-medium mt-0.5 leading-none"
              :class="typeConfig.colorClass"
            >{{ typeConfig.label }}</p>
          </div>
        </div>

        <!-- ── Type tabs — underline style ───────────────── -->
        <div class="flex px-4">
          <button
            v-for="([t, cfg]) in (Object.entries(TYPE_CONFIG) as [TransactionType, typeof TYPE_CONFIG[TransactionType]][])"
            :key="t"
            type="button"
            class="flex-1 h-10 flex items-center justify-center gap-1.5 text-[13px] transition-colors border-b-2"
            :class="form.type === t
              ? [t === 'expense' ? 'border-destructive text-destructive' : t === 'income' ? 'border-success text-success' : 'border-muted-foreground/50 text-muted-foreground', 'font-semibold']
              : 'border-border/30 text-muted-foreground/60 hover:text-muted-foreground font-medium'"
            @click="form.type = t"
          >
            <component :is="cfg.icon" :size="14" />
            {{ cfg.label }}
          </button>
        </div>
      </div>

      <!-- ── Scrollable body ──────────────────────────────── -->
      <form class="flex-1 overflow-y-auto" @submit.prevent="submit">
        <div class="px-4 pt-5 pb-3 space-y-5">

          <!-- ── VALOR ────────────────────────────────────── -->
          <div class="text-center mb-2">
            <div class="flex items-center justify-center gap-1.5 mb-3">
              <span class="text-[18px] font-medium text-muted-foreground/60">R$</span>
              <input
                ref="amountInputRef"
                inputmode="numeric"
                placeholder="0,00"
                class="bg-transparent outline-none text-[40px] font-semibold tabular-nums tracking-tight w-auto max-w-[260px] text-center placeholder:text-muted-foreground/20"
                :class="typeConfig.amountColor"
                :value="form.amount"
                size="8"
                @input="onAmountInput"
                @focus="onAmountFocus"
              />
            </div>
            <p v-if="errors.amount" class="text-[11px] text-destructive mb-2">{{ errors.amount }}</p>
            <!-- Quick increments -->
            <div class="flex gap-2 justify-center">
              <button
                v-for="inc in QUICK_INCREMENTS"
                :key="inc"
                type="button"
                class="h-7 px-3 rounded-full text-[11px] font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                @click="addAmount(inc)"
              >
                +{{ inc }}
              </button>
            </div>
          </div>

          <!-- ── CATEGORIA — grid visual ────────────────────── -->
          <div v-if="form.type !== 'transfer'">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
                Categoria
              </p>
              <button
                v-if="form.category_id"
                type="button"
                class="text-[11px] text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-0.5 transition-colors"
                @click="form.category_id = ''"
              >
                <X :size="10" />
                Limpar
              </button>
            </div>

            <!-- 4-column icon grid -->
            <div class="grid grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-0.5">
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                class="flex flex-col items-center transition-all active:scale-95"
                @click="form.category_id = form.category_id === cat.id ? '' : cat.id"
              >
                <span
                  class="size-14 rounded-xl flex items-center justify-center transition-all"
                  :style="form.category_id === cat.id
                    ? { background: cat.color + '30', outline: '1.5px solid ' + cat.color + '60' }
                    : { background: cat.color + '18' }"
                >
                  <component
                    v-if="cat.icon && findIcon(cat.icon)"
                    :is="findIcon(cat.icon)!.component"
                    :size="24"
                    :style="{ color: cat.color }"
                  />
                  <span v-else class="text-[14px] font-bold" :style="{ color: cat.color }">{{ cat.name.charAt(0) }}</span>
                </span>
                <span class="text-[11px] text-muted-foreground mt-1.5 truncate max-w-[56px] text-center leading-tight">
                  {{ cat.name }}
                </span>
              </button>

            </div>

            <!-- Category quick-create sheet -->
            <CategoryQuickCreateSheet
              v-model:open="showCategorySheet"
              :default-type="(form.type as 'income' | 'expense')"
              @created="(cat) => { form.category_id = cat.id }"
            />
          </div>

          <!-- ── TÍTULO ────────────────────────────────────── -->
          <div>
            <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
              Título
            </p>
            <input
              v-model="form.description"
              :placeholder="descriptionPlaceholder"
              class="w-full h-11 rounded-lg px-3.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 bg-card border border-border"
            />
            <p v-if="errors.description" class="text-[11px] text-destructive mt-1">{{ errors.description }}</p>
          </div>

          <!-- ── DATA ─────────────────────────────────────── -->
          <div>
            <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
              Data
            </p>
            <div class="flex gap-1.5 mb-2">
              <button
                type="button"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="dateShortcut === 'today'
                  ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                  : 'bg-card border-border text-muted-foreground'"
                @click="form.transaction_date = todayStr"
              >
                Hoje
              </button>
              <button
                type="button"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="dateShortcut === 'yesterday'
                  ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                  : 'bg-card border-border text-muted-foreground'"
                @click="form.transaction_date = yesterdayStr"
              >
                Ontem
              </button>
              <button
                type="button"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="dateShortcut === 'custom'
                  ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                  : 'bg-card border-border text-muted-foreground'"
                @click="form.transaction_date = dateShortcut === 'custom' ? form.transaction_date : ''"
              >
                Personalizado
              </button>
            </div>
            <DatePicker v-if="dateShortcut === 'custom'" v-model="form.transaction_date" />
            <p v-if="dateShortcut !== 'custom'" class="text-[12px] text-muted-foreground/60 mt-1.5 ml-0.5">
              {{ new Date(form.transaction_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
            </p>
            <p v-if="errors.transaction_date" class="text-[11px] text-destructive mt-1">{{ errors.transaction_date }}</p>
          </div>

          <!-- ── CONTA(S) ──────────────────────────────────── -->
          <div v-if="store.activeAccounts.length === 0" class="flex flex-col items-center justify-center gap-2 py-5 rounded-lg border border-dashed border-border text-center">
            <Wallet :size="22" class="text-muted-foreground/40" />
            <p class="text-[12px] text-muted-foreground/50">Nenhuma conta cadastrada</p>
          </div>

          <template v-else-if="form.type === 'transfer'">
            <!-- Origin account -->
            <div>
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
                Conta de origem <span class="text-destructive">*</span>
              </p>
              <div class="space-y-2">
                <button
                  v-for="acc in store.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === form.destination_account_id"
                  class="w-full flex items-center gap-3 h-14 px-4 rounded-xl border transition-all outline-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                  :class="form.account_id === acc.id ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card hover:border-border'"
                  @click="form.account_id = form.account_id === acc.id ? '' : acc.id"
                >
                  <span
                    class="size-10 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-semibold"
                    :style="{ background: acc.color ? acc.color + '25' : 'hsl(var(--muted))', color: acc.color ?? 'hsl(var(--muted-foreground))' }"
                  >
                    {{ acc.name.charAt(0).toUpperCase() }}
                  </span>
                  <div class="min-w-0 flex-1 text-left">
                    <p class="text-[14px] font-medium text-foreground leading-none">{{ acc.name }}</p>
                    <p class="text-[11px] text-muted-foreground mt-1 leading-none">{{ ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-[14px] tabular-nums font-semibold" :class="acc.balance >= 0 ? 'text-success' : 'text-destructive'">
                      {{ formatCurrency(acc.balance) }}
                    </p>
                    <div v-if="form.account_id === acc.id" class="flex justify-end mt-0.5">
                      <Check :size="10" class="text-primary" />
                    </div>
                  </div>
                </button>
              </div>
              <p v-if="errors.account_id" class="text-[11px] text-destructive mt-1">{{ errors.account_id }}</p>
            </div>

            <!-- Destination account -->
            <div>
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
                Conta de destino <span class="text-destructive">*</span>
              </p>
              <div class="space-y-2">
                <button
                  v-for="acc in store.activeAccounts"
                  :key="acc.id"
                  type="button"
                  :disabled="acc.id === form.account_id"
                  class="w-full flex items-center gap-3 h-14 px-4 rounded-xl border transition-all outline-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                  :class="form.destination_account_id === acc.id ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card hover:border-border'"
                  @click="form.destination_account_id = form.destination_account_id === acc.id ? '' : acc.id"
                >
                  <span
                    class="size-10 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-semibold"
                    :style="{ background: acc.color ? acc.color + '25' : 'hsl(var(--muted))', color: acc.color ?? 'hsl(var(--muted-foreground))' }"
                  >
                    {{ acc.name.charAt(0).toUpperCase() }}
                  </span>
                  <div class="min-w-0 flex-1 text-left">
                    <p class="text-[14px] font-medium text-foreground leading-none">{{ acc.name }}</p>
                    <p class="text-[11px] text-muted-foreground mt-1 leading-none">{{ ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-[14px] tabular-nums font-semibold" :class="acc.balance >= 0 ? 'text-success' : 'text-destructive'">
                      {{ formatCurrency(acc.balance) }}
                    </p>
                    <div v-if="form.destination_account_id === acc.id" class="flex justify-end mt-0.5">
                      <Check :size="10" class="text-primary" />
                    </div>
                  </div>
                </button>
              </div>
              <p v-if="errors.destination_account_id" class="text-[11px] text-destructive mt-1">{{ errors.destination_account_id }}</p>
            </div>
          </template>

          <!-- Single account for income/expense -->
          <div v-else>
            <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
              Conta <span class="text-destructive">*</span>
            </p>
            <div class="space-y-2">
              <button
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                type="button"
                class="w-full flex items-center gap-3 h-14 px-4 rounded-xl border transition-all outline-none active:scale-[0.99]"
                :class="form.account_id === acc.id ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card hover:border-border'"
                @click="form.account_id = form.account_id === acc.id ? '' : acc.id"
              >
                <span
                  class="size-10 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-semibold"
                  :style="{ background: acc.color ? acc.color + '25' : 'hsl(var(--muted))', color: acc.color ?? 'hsl(var(--muted-foreground))' }"
                >
                  {{ acc.name.charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0 flex-1 text-left">
                  <p class="text-[14px] font-medium text-foreground leading-none">{{ acc.name }}</p>
                  <p class="text-[11px] text-muted-foreground mt-1 leading-none">{{ ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-[14px] tabular-nums font-semibold" :class="acc.balance >= 0 ? 'text-success' : 'text-destructive'">
                    {{ formatCurrency(acc.balance) }}
                  </p>
                  <div v-if="form.account_id === acc.id" class="flex justify-end mt-0.5">
                    <Check :size="10" class="text-primary" />
                  </div>
                </div>
              </button>
            </div>
            <p v-if="errors.account_id" class="text-[11px] text-destructive mt-1">{{ errors.account_id }}</p>
          </div>

          <!-- ── TRANSAÇÃO FIXA — inline toggle row ─────────── -->
          <div v-if="form.type !== 'transfer'">
            <div class="flex items-center gap-3 py-3 border-b border-border/40">
              <span
                class="size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                :class="form.is_recurring ? 'bg-primary/10' : 'bg-muted'"
              >
                <Repeat :size="16" :class="form.is_recurring ? 'text-primary' : 'text-muted-foreground'" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-foreground">Transação fixa</p>
                <p class="text-[11px] text-muted-foreground">
                  {{ form.is_recurring ? ('A cada ' + (FREQ_LABELS[form.recurrence_frequency] ?? 'mês')) : 'Repete periodicamente' }}
                </p>
              </div>
              <button
                type="button"
                class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
                :class="form.is_recurring ? 'bg-primary' : 'bg-muted'"
                @click="form.is_recurring = !form.is_recurring; if (form.is_recurring) form.total_installments = 0"
              >
                <span
                  class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                  :class="form.is_recurring ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Recurrence expanded config -->
            <div v-if="form.is_recurring" class="pt-3 pb-4 space-y-3">
              <!-- Frequency pills -->
              <div>
                <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">Frequência</p>
                <div class="flex gap-1.5 flex-wrap">
                  <button
                    v-for="opt in FREQUENCY_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="h-8 px-2.5 rounded-md text-[11px] font-medium border transition-all"
                    :class="form.recurrence_frequency === opt.value
                      ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'"
                    @click="form.recurrence_frequency = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <!-- End condition -->
              <div>
                <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">Término</p>
                <div class="flex gap-1.5 flex-wrap mb-3">
                  <button
                    type="button"
                    class="h-8 px-2.5 rounded-md text-[11px] font-medium border transition-all"
                    :class="form.recurrence_end_type === 'never'
                      ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'"
                    @click="form.recurrence_end_type = 'never'"
                  >
                    Sem término
                  </button>
                  <button
                    type="button"
                    class="h-8 px-2.5 rounded-md text-[11px] font-medium border transition-all"
                    :class="form.recurrence_end_type === 'count'
                      ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'"
                    @click="form.recurrence_end_type = 'count'"
                  >
                    Nº de vezes
                  </button>
                  <button
                    type="button"
                    class="h-8 px-2.5 rounded-md text-[11px] font-medium border transition-all"
                    :class="form.recurrence_end_type === 'date'
                      ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'"
                    @click="form.recurrence_end_type = 'date'"
                  >
                    Data limite
                  </button>
                </div>
                <div v-if="form.recurrence_end_type === 'count'" class="flex items-center gap-2.5">
                  <input
                    v-model.number="form.recurrence_count"
                    type="number"
                    inputmode="numeric"
                    min="2"
                    max="260"
                    class="w-20 h-10 px-3 rounded-lg bg-card border border-border text-[14px] text-center text-foreground outline-none tabular-nums"
                  />
                  <span class="text-[13px] text-muted-foreground">ocorrências</span>
                </div>
                <input
                  v-if="form.recurrence_end_type === 'date'"
                  v-model="form.recurrence_end_date"
                  type="date"
                  class="h-10 px-3 rounded-lg bg-card border border-border text-[13px] text-foreground outline-none w-full"
                />
              </div>

              <!-- Preview -->
              <p class="text-[11px] text-muted-foreground/70 leading-relaxed mt-1">
                A cada <strong class="text-foreground">{{ FREQ_LABELS[form.recurrence_frequency] ?? 'mês' }}</strong>
                <template v-if="nextOccurrenceLabel"> · próxima em <strong class="text-foreground">{{ nextOccurrenceLabel }}</strong></template>
                <template v-if="form.recurrence_end_type === 'count'"> · por <strong class="text-foreground">{{ form.recurrence_count }} ocorrências</strong></template>
                <template v-else-if="form.recurrence_end_type === 'date' && form.recurrence_end_date"> · até <strong class="text-foreground">{{ new Date(form.recurrence_end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) }}</strong></template>
                <template v-else> · sem data de término</template>
              </p>
            </div>
          </div>

          <!-- ── COMPRA PARCELADA — inline toggle row ──────── -->
          <div v-if="form.type !== 'transfer' && !props.transaction">
            <div class="flex items-center gap-3 py-3 border-b border-border/40">
              <span
                class="size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                :class="isInstallment ? 'bg-primary/10' : 'bg-muted'"
              >
                <CreditCard :size="16" :class="isInstallment ? 'text-primary' : 'text-muted-foreground'" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-foreground">Compra parcelada</p>
                <p class="text-[11px] text-muted-foreground">
                  <template v-if="isInstallment && installmentAmount > 0">
                    {{ form.total_installments }}x de R$ {{ installmentAmount.toFixed(2).replace('.', ',') }}
                  </template>
                  <template v-else>Dividir em parcelas mensais</template>
                </p>
              </div>
              <button
                type="button"
                class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
                :class="isInstallment ? 'bg-primary' : 'bg-muted'"
                @click="toggleInstallments(form.total_installments >= 2 ? 0 : 2)"
              >
                <span
                  class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                  :class="isInstallment ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Installment count pills -->
            <div v-if="isInstallment" class="pt-3 pb-4">
              <div class="flex gap-1.5 flex-wrap mb-2.5">
                <button
                  v-for="n in INSTALLMENT_OPTIONS"
                  :key="n"
                  type="button"
                  class="h-8 px-3 rounded-md text-[12px] font-medium border transition-all"
                  :class="form.total_installments === n
                    ? 'bg-primary/12 border border-primary/30 text-primary font-medium'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'"
                  @click="form.total_installments = n"
                >
                  {{ n }}x
                </button>
              </div>
              <div v-if="installmentAmount > 0" class="space-y-0.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-muted-foreground">{{ form.total_installments }} parcelas de</span>
                  <span class="tabular-nums font-semibold text-foreground">
                    R$ {{ installmentAmount.toFixed(2).replace('.', ',') }}
                  </span>
                </div>
                <div
                  v-if="lastInstallmentAmount !== installmentAmount"
                  class="flex items-center justify-between text-[10px]"
                >
                  <span class="text-muted-foreground/60">última parcela</span>
                  <span class="tabular-nums text-muted-foreground/60">
                    R$ {{ lastInstallmentAmount.toFixed(2).replace('.', ',') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── TAGS ─────────────────────────────────────── -->
          <div v-if="store.tags.length > 0">
            <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
              Tags
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="tag in store.tags"
                :key="tag.id"
                type="button"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium border transition-all"
                :class="form.tag_ids.includes(tag.id)
                  ? 'border-transparent'
                  : 'border-border text-muted-foreground bg-card hover:text-foreground'"
                :style="form.tag_ids.includes(tag.id) ? { background: tag.color, color: getContrastColor(tag.color) } : {}"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
                <X v-if="form.tag_ids.includes(tag.id)" :size="9" :stroke-width="2.5" />
              </button>

              <!-- Inline create -->
              <div class="inline-flex items-center h-7 rounded-md border border-dashed border-border/50 overflow-hidden bg-card">
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
            <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
              Observações
            </p>
            <div class="relative">
              <Textarea
                v-model="form.notes"
                placeholder="Detalhes extras, referência, contexto..."
                class="resize-none h-20 text-[13px] rounded-lg pr-12 placeholder:text-muted-foreground/40 outline-none transition-colors bg-card border border-border"
              />
              <span class="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/40 tabular-nums">
                {{ form.notes?.length ?? 0 }}/500
              </span>
            </div>
          </div>

        </div>
      </form>

      <!-- ── Sticky footer — CTA ──────────────────────────── -->
      <div class="sticky bottom-0 px-5 pt-3 pb-6 shrink-0 bg-background">
        <button
          type="button"
          class="w-full h-[52px] rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          :class="[(!isFormValid || submitting) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90', typeConfig.saveBg, 'text-background']"
          :disabled="submitting || !isFormValid"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          <template v-else>
            <Check :size="16" />
            <span>{{ submitLabel }}</span>
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
