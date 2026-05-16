<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { DatePicker } from '@ui/date-picker'
import { Textarea } from '@ui/textarea'
import { Label } from '@ui/label'
import { Checkbox } from '@ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { Loader2 } from 'lucide-vue-next'
import { AppFormField } from '@/components/shared'
import { findIcon } from '@/lib/icons'
import type { Transaction, TransactionType } from '@/types/finance'
import { TRANSACTION_TYPE_LABELS } from '@/types/finance'
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

const transactionTypes: TransactionType[] = ['expense', 'income', 'transfer']

const filteredCategories = computed(() =>
  store.categories.filter(
    (c) => form.type !== 'transfer' && (!form.type || c.type === form.type),
  ),
)

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

function onAccountChange(val: string) {
  form.account_id = val === '__none__' ? '' : val
  if (form.account_id) form.card_id = ''
}

function onCardChange(val: string) {
  form.card_id = val === '__none__' ? '' : val
  if (form.card_id) form.account_id = ''
}

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
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ transaction ? 'Editar transação' : 'Nova transação' }}
        </DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <!-- Type toggle -->
        <div class="flex gap-2">
          <button
            v-for="t in transactionTypes"
            :key="t"
            type="button"
            :class="[
              'flex-1 h-9 rounded-md text-sm font-medium border transition-all',
              form.type === t
                ? t === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/60'
                  : t === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/60'
                : 'border-border text-muted-foreground hover:bg-accent',
            ]"
            @click="form.type = t"
          >
            {{ TRANSACTION_TYPE_LABELS[t] }}
          </button>
        </div>

        <!-- Title (= description field) -->
        <AppFormField label="Título" :error="errors.description" required>
          <Input v-model="form.description" placeholder="Onde/o quê? Ex: iFood, Salário" class="h-9" />
        </AppFormField>

        <!-- Amount -->
        <AppFormField label="Valor (R$)" :error="errors.amount" required>
          <Input
            v-model="form.amount"
            inputmode="decimal"
            placeholder="0,00"
            class="h-9"
          />
        </AppFormField>

        <!-- Date -->
        <AppFormField label="Data" :error="errors.transaction_date" required>
          <DatePicker v-model="form.transaction_date" />
        </AppFormField>

        <!-- Category icon grid (hidden for transfer) -->
        <AppFormField v-if="form.type !== 'transfer'" label="Categoria">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in filteredCategories"
              :key="cat.id"
              type="button"
              :title="cat.name"
              :class="[
                'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border-2 transition-all min-w-[52px]',
                form.category_id === cat.id
                  ? 'bg-accent/20'
                  : 'border-border hover:border-foreground/20 hover:bg-accent/30',
              ]"
              :style="form.category_id === cat.id ? { borderColor: cat.color } : {}"
              @click="form.category_id = form.category_id === cat.id ? '' : cat.id"
            >
              <span
                class="flex items-center justify-center w-8 h-8 rounded-md"
                :style="{ backgroundColor: cat.color + '25', color: cat.color }"
              >
                <component
                  :is="cat.icon ? findIcon(cat.icon)?.component : null"
                  v-if="cat.icon && findIcon(cat.icon)"
                  :size="16"
                />
                <span v-else class="text-xs font-bold">{{ cat.name.charAt(0) }}</span>
              </span>
              <span class="text-[10px] text-muted-foreground leading-tight text-center line-clamp-1 max-w-[48px]">
                {{ cat.name }}
              </span>
            </button>
          </div>
        </AppFormField>

        <!-- Account + Card -->
        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Conta">
            <Select
              :model-value="form.account_id || '__none__'"
              @update:model-value="onAccountChange($event as string)"
            >
              <SelectTrigger class="h-9">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                <SelectItem
                  v-for="acc in store.activeAccounts"
                  :key="acc.id"
                  :value="acc.id"
                >
                  {{ acc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </AppFormField>

          <AppFormField label="Cartão">
            <Select
              :model-value="form.card_id || '__none__'"
              @update:model-value="onCardChange($event as string)"
            >
              <SelectTrigger class="h-9">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                <SelectItem
                  v-for="card in store.activeCards"
                  :key="card.id"
                  :value="card.id"
                >
                  {{ card.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </AppFormField>
        </div>

        <!-- Notes -->
        <AppFormField label="Observações">
          <Textarea v-model="form.notes" placeholder="Opcional..." class="resize-none h-16 text-sm" />
        </AppFormField>

        <!-- Recurring -->
        <div class="flex items-center gap-2">
          <Checkbox id="recurring" v-model:checked="form.is_recurring" />
          <Label for="recurring" class="text-sm font-normal cursor-pointer">
            Transação recorrente
          </Label>
        </div>
      </form>

      <DialogFooter class="gap-2">
        <Button variant="outline" :disabled="submitting" @click="close">Cancelar</Button>
        <Button :disabled="submitting" @click="submit">
          <Loader2 v-if="submitting" :size="14" class="mr-1.5 animate-spin" />
          {{ transaction ? 'Salvar' : 'Registrar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
