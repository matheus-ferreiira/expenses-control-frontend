<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import { Textarea } from '@ui/textarea'
import { ArrowLeft, Loader2, Plus, Repeat2, Tag, X } from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import type { Transaction, TransactionType, RecurrenceUpdateScope } from '@/types/finance'
import { useTransactionForm } from '../composables/useTransactionForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
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

const segmentedTypes: TransactionType[] = ['expense', 'income']

// ── Amount field ref for auto-focus ─────────────────────────────────────────
const amountInputRef = ref<HTMLInputElement | null>(null)

// ── Form validity (for disabling submit) ─────────────────────────────────────
const isFormValid = computed(() => {
  const parsed = parseFloat(form.amount.replace(',', '.'))
  const hasInstrument = !!form.account_id || !!form.card_id
  return form.description.trim().length > 0 && !isNaN(parsed) && parsed > 0 && hasInstrument
})

// ── Quick amount increments ───────────────────────────────────────────────────
const QUICK_INCREMENTS = [10, 50, 100, 500]

function addAmount(inc: number) {
  const current = parseFloat(form.amount.replace(',', '.')) || 0
  form.amount = (current + inc).toFixed(2).replace('.', ',')
}

// ── Recurring scope dialog ───────────────────────────────────────────────────
const scopeDialogOpen = ref(false)

/** True when the transaction being edited belongs to a recurrence group */
const isEditingRecurring = computed(
  () => !!props.transaction?.recurrence_group_id,
)

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

const filteredCategories = computed(() =>
  store.categories.filter(
    (c) => form.type !== 'transfer' && (!form.type || c.type === form.type),
  ),
)

const submitLabel = computed(() => {
  if (props.transaction) return 'Salvar alterações'
  return form.type === 'income' ? 'Registrar receita' : 'Salvar despesa'
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.transaction) fromTransaction(props.transaction)
      else {
        reset()
        // Apply optional prefill for quick shortcuts
        if (props.prefill) {
          const p = props.prefill
          if (p.type) form.type = p.type
          if (p.description) form.description = p.description
          if (p.amount) form.amount = p.amount
          if (p.category_id) form.category_id = p.category_id
          if (p.account_id) form.account_id = p.account_id
        }
      }
      // Auto-focus amount field after sheet animation
      nextTick(() => setTimeout(() => amountInputRef.value?.focus(), 150))
    }
  },
)

watch(
  () => form.type,
  () => {
    form.category_id = ''
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!validate()) return

  // Editing a recurring series: ask user which scope to apply
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
      // Haptic feedback on mobile
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
      class="rounded-t-2xl border-t border-border bg-card p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />

      <!-- Sticky header -->
      <div class="sticky top-0 bg-card z-10 flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-md hover:bg-accent transition-colors -ml-1"
          @click="close"
        >
          <ArrowLeft :size="18" />
        </button>
        <h2 class="text-sm font-semibold">
          {{ transaction ? 'Editar transação' : 'Nova transação' }}
        </h2>
      </div>

      <!-- Scrollable body -->
      <form class="flex-1 overflow-y-auto" @submit.prevent="submit">
        <div class="px-4 py-5 space-y-5">

          <!-- Segmented type toggle (Despesa / Receita) -->
          <div class="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
            <button
              v-for="t in segmentedTypes"
              :key="t"
              type="button"
              class="h-9 rounded-lg text-sm font-semibold transition-all"
              :class="form.type === t
                ? t === 'expense'
                  ? 'bg-destructive/20 text-destructive shadow-sm'
                  : 'bg-success/20 text-success shadow-sm'
                : 'text-muted-foreground hover:text-foreground'"
              @click="form.type = t"
            >
              {{ t === 'expense' ? 'Despesa' : 'Receita' }}
            </button>
          </div>
          <!-- Transfer as small secondary option -->
          <div class="flex items-center justify-center -mt-2">
            <button
              type="button"
              class="text-[11px] text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2 transition-colors"
              @click="form.type = form.type === 'transfer' ? 'expense' : 'transfer'"
            >
              {{ form.type === 'transfer' ? 'Voltar para despesa/receita' : 'Registrar como transferência' }}
            </button>
          </div>

          <!-- Amount — large colored input -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">Valor</p>
            <div
              class="flex items-center gap-2 h-14 px-4 rounded-xl border-2 transition-colors"
              :class="form.type === 'expense'
                ? 'border-destructive/30 bg-destructive/5'
                : form.type === 'income'
                  ? 'border-success/30 bg-success/5'
                  : 'border-border bg-muted/30'"
            >
              <span
                class="text-2xl font-semibold shrink-0"
                :class="form.type === 'expense' ? 'text-destructive/70' : form.type === 'income' ? 'text-success/70' : 'text-muted-foreground'"
              >R$</span>
              <input
                ref="amountInputRef"
                v-model="form.amount"
                inputmode="decimal"
                placeholder="0,00"
                class="bg-transparent outline-none w-full text-2xl font-semibold tabular-nums placeholder:text-muted-foreground/30"
                :class="form.type === 'expense' ? 'text-destructive' : form.type === 'income' ? 'text-success' : 'text-foreground'"
              />
            </div>
            <p v-if="errors.amount" class="text-xs text-destructive mt-1">{{ errors.amount }}</p>
            <!-- Quick amount increment pills -->
            <div class="flex gap-1.5 mt-2">
              <button
                v-for="inc in QUICK_INCREMENTS"
                :key="inc"
                type="button"
                class="flex-1 h-7 rounded-lg text-[11px] font-medium bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/30"
                @click="addAmount(inc)"
              >
                +{{ inc }}
              </button>
            </div>
          </div>

          <!-- Title -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">Título</p>
            <input
              v-model="form.description"
              placeholder="Onde/o quê? Ex: iFood, Salário"
              class="w-full h-11 px-3.5 rounded-xl bg-muted border border-border/50 focus:border-border outline-none text-sm transition-colors"
            />
            <p v-if="errors.description" class="text-xs text-destructive mt-1">{{ errors.description }}</p>
          </div>

          <!-- Date -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">Data</p>
            <DatePicker v-model="form.transaction_date" />
            <p v-if="errors.transaction_date" class="text-xs text-destructive mt-1">{{ errors.transaction_date }}</p>
          </div>

          <!-- Category grid (hidden for transfer) -->
          <div v-if="form.type !== 'transfer' && filteredCategories.length > 0">
            <p class="text-xs font-medium text-muted-foreground mb-2">Categoria</p>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cat in filteredCategories.slice(0, 8)"
                :key="cat.id"
                type="button"
                class="h-[72px] rounded-xl border text-[11px] font-medium leading-tight px-1 flex flex-col items-center justify-center gap-1.5 transition-all"
                :class="form.category_id === cat.id
                  ? 'bg-muted text-foreground border-2'
                  : 'border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground'"
                :style="form.category_id === cat.id ? { borderColor: cat.color } : {}"
                @click="form.category_id = form.category_id === cat.id ? '' : cat.id"
              >
                <span
                  class="flex items-center justify-center w-8 h-8 rounded-lg"
                  :style="{ backgroundColor: cat.color + '25', color: cat.color }"
                >
                  <component
                    :is="cat.icon && findIcon(cat.icon) ? findIcon(cat.icon)!.component : null"
                    v-if="cat.icon && findIcon(cat.icon)"
                    :size="16"
                  />
                  <span v-else class="text-xs font-bold">{{ cat.name.charAt(0) }}</span>
                </span>
                <span class="truncate w-full text-center">{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- Account pills -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-2">
              Conta
              <span class="text-destructive ml-0.5">*</span>
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                type="button"
                class="h-9 px-3.5 rounded-full text-xs font-medium border transition-all"
                :class="form.account_id === acc.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'"
                @click="form.account_id = form.account_id === acc.id ? '' : acc.id; form.card_id = ''"
              >
                {{ acc.name }}
              </button>
              <span v-if="store.activeAccounts.length === 0" class="text-[11px] text-muted-foreground/60">
                Nenhuma conta cadastrada
              </span>
            </div>
            <p v-if="errors.account_id" class="text-xs text-destructive mt-1">{{ errors.account_id }}</p>
          </div>

          <!-- Card pills -->
          <div v-if="store.activeCards.length > 0">
            <p class="text-xs font-medium text-muted-foreground mb-2">Cartão</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="card in store.activeCards"
                :key="card.id"
                type="button"
                class="h-9 px-3.5 rounded-full text-xs font-medium border transition-all"
                :class="form.card_id === card.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'"
                @click="form.card_id = form.card_id === card.id ? '' : card.id; form.account_id = ''"
              >
                {{ card.name }}
              </button>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="store.tags.length > 0 || true">
            <p class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Tag :size="12" />
              Tags
            </p>
            <div class="flex flex-wrap gap-2">
              <!-- Existing tags — toggle selection -->
              <button
                v-for="tag in store.tags"
                :key="tag.id"
                type="button"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-medium border transition-all"
                :class="form.tag_ids.includes(tag.id)
                  ? 'border-transparent text-white'
                  : 'border-border/60 text-muted-foreground hover:border-border bg-transparent'"
                :style="form.tag_ids.includes(tag.id) ? { background: tag.color } : {}"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
                <X v-if="form.tag_ids.includes(tag.id)" :size="9" :stroke-width="2.5" />
              </button>

              <!-- Inline create -->
              <div class="inline-flex items-center h-7 rounded-full border border-dashed border-border/60 overflow-hidden bg-muted/30">
                <input
                  v-model="newTagName"
                  placeholder="Nova tag..."
                  class="bg-transparent text-xs pl-2.5 pr-1 outline-none text-muted-foreground w-24 placeholder:text-muted-foreground/40"
                  @keydown.enter.prevent="createInlineTag"
                />
                <button
                  type="button"
                  class="h-full px-2 text-muted-foreground hover:text-foreground transition-colors"
                  :disabled="creatingTag || !newTagName.trim()"
                  @click="createInlineTag"
                >
                  <Loader2 v-if="creatingTag" :size="10" class="animate-spin" />
                  <Plus v-else :size="10" :stroke-width="2.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">Observações</p>
            <Textarea
              v-model="form.notes"
              placeholder="Opcional..."
              class="resize-none h-16 text-sm bg-muted border-border/50 focus:border-border rounded-xl"
            />
          </div>

          <!-- Recurring toggle (fix) -->
          <div
            class="flex items-center justify-between gap-4 pb-2 pt-3 border-t border-border/30 cursor-pointer"
            @click="form.is_recurring = !form.is_recurring"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                class="flex items-center justify-center size-8 rounded-lg shrink-0 transition-colors"
                :class="form.is_recurring ? 'bg-violet-500/15 text-violet-400' : 'bg-muted text-muted-foreground/50'"
              >
                <Repeat2 :size="15" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-medium leading-none mb-0.5">Transação fix</p>
                <p class="text-[11px] text-muted-foreground/50 leading-none">Gera 60 meses automaticamente</p>
              </div>
            </div>
            <!-- Toggle switch -->
            <button
              type="button"
              class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
              :class="form.is_recurring ? 'bg-violet-500' : 'bg-muted'"
              @click.stop="form.is_recurring = !form.is_recurring"
            >
              <span
                class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
                :class="form.is_recurring ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

        </div>
      </form>

      <!-- Sticky footer -->
      <div class="sticky bottom-0 bg-card border-t border-border px-4 py-3 shrink-0">
        <button
          type="button"
          class="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          :class="[
            form.type === 'income'
              ? 'bg-success text-background'
              : form.type === 'expense'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-foreground text-background',
            (!isFormValid || submitting) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90',
          ]"
          :disabled="submitting || !isFormValid"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="14" class="animate-spin" />
          {{ submitLabel }}
        </button>
      </div>

    </SheetContent>
  </Sheet>

  <!-- Recurring scope picker — shown before submitting an edit on a recurring series -->
  <RecurringEditScopeDialog
    v-model:open="scopeDialogOpen"
    @confirm="handleScopeConfirm"
  />
</template>
