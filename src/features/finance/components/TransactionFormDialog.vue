<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { DatePicker } from '@ui/date-picker'
import { Checkbox } from '@ui/checkbox'
import { Label } from '@ui/label'
import { Textarea } from '@ui/textarea'
import { ArrowLeft, Loader2, Plus, Tag, X } from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import type { Transaction, TransactionType } from '@/types/finance'
import { useTransactionForm } from '../composables/useTransactionForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  transaction?: Transaction | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [t: Transaction]
  updated: [t: Transaction]
}>()

const store = useFinanceStore()
const toast = useToast()
const { form, errors, submitting, fromTransaction, reset, validate, toPayload } =
  useTransactionForm()

const segmentedTypes: TransactionType[] = ['expense', 'income']

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
      else reset()
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
  submitting.value = true
  try {
    if (props.transaction) {
      const updated = await store.updateTransaction(props.transaction.id, toPayload())
      emit('updated', updated)
      toast.success('Transação atualizada')
    } else {
      const created = await store.createTransaction(toPayload())
      emit('created', created)
      toast.success('Transação registrada')
    }
    close()
  } catch {
    toast.error('Erro ao salvar transação')
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
        <div class="px-4 py-4 space-y-5">

          <!-- Segmented type toggle (Despesa / Receita) -->
          <div class="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              v-for="t in segmentedTypes"
              :key="t"
              type="button"
              class="h-8 rounded-md text-sm font-medium transition-all"
              :class="form.type === t
                ? t === 'expense'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-success/15 text-success'
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
              class="text-[11px] text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 transition-colors"
              @click="form.type = form.type === 'transfer' ? 'expense' : 'transfer'"
            >
              {{ form.type === 'transfer' ? 'Voltar para despesa/receita' : 'Registrar como transferência' }}
            </button>
          </div>

          <!-- Amount — large colored input -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Valor</p>
            <div
              class="text-3xl font-semibold tabular-nums flex items-center gap-1"
              :class="form.type === 'expense' ? 'text-destructive' : form.type === 'income' ? 'text-success' : 'text-foreground'"
            >
              <span>R$</span>
              <input
                v-model="form.amount"
                inputmode="decimal"
                placeholder="0,00"
                class="bg-transparent outline-none w-full text-3xl font-semibold tabular-nums placeholder:text-muted-foreground/40"
              />
            </div>
            <p v-if="errors.amount" class="text-xs text-destructive mt-1">{{ errors.amount }}</p>
          </div>

          <!-- Title -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Título</p>
            <input
              v-model="form.description"
              placeholder="Onde/o quê? Ex: iFood, Salário"
              class="w-full h-11 px-3 rounded-md bg-muted/50 border border-transparent focus:border-border outline-none text-sm transition-colors"
            />
            <p v-if="errors.description" class="text-xs text-destructive mt-1">{{ errors.description }}</p>
          </div>

          <!-- Date -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Data</p>
            <DatePicker v-model="form.transaction_date" />
            <p v-if="errors.transaction_date" class="text-xs text-destructive mt-1">{{ errors.transaction_date }}</p>
          </div>

          <!-- Category grid (hidden for transfer) -->
          <div v-if="form.type !== 'transfer' && filteredCategories.length > 0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Categoria</p>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cat in filteredCategories.slice(0, 8)"
                :key="cat.id"
                type="button"
                class="h-20 rounded-lg border text-[11px] font-medium leading-tight px-1 flex flex-col items-center justify-center gap-1.5 transition-all"
                :class="form.category_id === cat.id
                  ? 'bg-muted text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/40'"
                :style="form.category_id === cat.id ? { borderColor: cat.color } : {}"
                @click="form.category_id = form.category_id === cat.id ? '' : cat.id"
              >
                <span
                  class="flex items-center justify-center w-7 h-7 rounded-md"
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
          <div v-if="store.activeAccounts.length > 0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Conta</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                type="button"
                class="h-9 px-3 rounded-full text-xs font-medium border transition-all"
                :class="form.account_id === acc.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/40'"
                @click="form.account_id = form.account_id === acc.id ? '' : acc.id; form.card_id = ''"
              >
                {{ acc.name }}
              </button>
            </div>
          </div>

          <!-- Card pills -->
          <div v-if="store.activeCards.length > 0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Cartão</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="card in store.activeCards"
                :key="card.id"
                type="button"
                class="h-9 px-3 rounded-full text-xs font-medium border transition-all"
                :class="form.card_id === card.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/40'"
                @click="form.card_id = form.card_id === card.id ? '' : card.id; form.account_id = ''"
              >
                {{ card.name }}
              </button>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="store.tags.length > 0 || true">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2 flex items-center gap-1">
              <Tag :size="10" />
              Tags
            </p>
            <div class="flex flex-wrap gap-2">
              <!-- Existing tags — toggle selection -->
              <button
                v-for="tag in store.tags"
                :key="tag.id"
                type="button"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all"
                :class="form.tag_ids.includes(tag.id)
                  ? 'border-transparent text-white'
                  : 'border-border text-muted-foreground hover:border-border/80 bg-transparent'"
                :style="form.tag_ids.includes(tag.id) ? { background: tag.color } : {}"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
                <X v-if="form.tag_ids.includes(tag.id)" :size="9" :stroke-width="2.5" />
              </button>

              <!-- Inline create -->
              <div class="inline-flex items-center h-7 rounded-full border border-dashed border-border overflow-hidden">
                <input
                  v-model="newTagName"
                  placeholder="Nova tag..."
                  class="bg-transparent text-[11px] pl-2.5 pr-1 outline-none text-muted-foreground w-24 placeholder:text-muted-foreground/40"
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
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Observações</p>
            <Textarea v-model="form.notes" placeholder="Opcional..." class="resize-none h-16 text-sm bg-muted/50 border-transparent focus:border-border" />
          </div>

          <!-- Recurring -->
          <div class="flex items-center gap-2 pb-2">
            <Checkbox id="recurring" v-model:checked="form.is_recurring" />
            <Label for="recurring" class="text-sm font-normal cursor-pointer">Transação recorrente</Label>
          </div>

        </div>
      </form>

      <!-- Sticky footer -->
      <div class="sticky bottom-0 bg-card border-t border-border px-4 py-3 shrink-0">
        <button
          type="button"
          class="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
          :class="form.type === 'income'
            ? 'bg-success text-background hover:opacity-90'
            : form.type === 'expense'
              ? 'bg-destructive text-destructive-foreground hover:opacity-90'
              : 'bg-foreground text-background hover:opacity-90'"
          :disabled="submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="14" class="animate-spin" />
          {{ submitLabel }}
        </button>
      </div>

    </SheetContent>
  </Sheet>
</template>
