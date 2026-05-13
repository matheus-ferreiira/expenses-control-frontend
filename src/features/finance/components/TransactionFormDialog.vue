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
import type { Transaction, TransactionType } from '@/types/finance'
import { TRANSACTION_TYPE_LABELS } from '@/types/finance'
import { NETWORK_LABELS } from '../types'
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

// Reset category when type changes
watch(
  () => form.type,
  () => {
    form.category_id = ''
  },
)

// Mutually exclusive: selecting account clears card and vice versa
function onAccountChange(val: string) {
  form.account_id = val
  if (val) form.credit_card_id = ''
}

function onCardChange(val: string) {
  form.credit_card_id = val
  if (val) form.account_id = ''
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
        <!-- Type + Amount row -->
        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Tipo" required>
            <Select v-model="form.type">
              <SelectTrigger class="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in transactionTypes" :key="t" :value="t">
                  {{ TRANSACTION_TYPE_LABELS[t] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </AppFormField>

          <AppFormField label="Valor (R$)" :error="errors.amount" required>
            <Input
              v-model="form.amount"
              inputmode="decimal"
              placeholder="0,00"
              class="h-9"
            />
          </AppFormField>
        </div>

        <!-- Description -->
        <AppFormField label="Descrição" :error="errors.description" required>
          <Input v-model="form.description" placeholder="Ex: Supermercado" class="h-9" />
        </AppFormField>

        <!-- Date -->
        <AppFormField label="Data" :error="errors.date" required>
          <Input v-model="form.date" type="date" class="h-9" />
        </AppFormField>

        <!-- Category (hidden for transfer) -->
        <AppFormField v-if="form.type !== 'transfer'" label="Categoria">
          <Select
            :model-value="form.category_id || ''"
            @update:model-value="form.category_id = $event as string"
          >
            <SelectTrigger class="h-9">
              <SelectValue placeholder="Sem categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sem categoria</SelectItem>
              <SelectItem v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </AppFormField>

        <!-- Account + Card -->
        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Conta">
            <Select
              :model-value="form.account_id || ''"
              @update:model-value="onAccountChange($event as string)"
            >
              <SelectTrigger class="h-9">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
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
              :model-value="form.credit_card_id || ''"
              @update:model-value="onCardChange($event as string)"
            >
              <SelectTrigger class="h-9">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                <SelectItem
                  v-for="card in store.activeCards"
                  :key="card.id"
                  :value="card.id"
                >
                  {{ card.name }}
                  <span class="text-muted-foreground ml-1 text-xs">{{ NETWORK_LABELS[card.network] }}</span>
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

        <AppFormField v-if="form.is_recurring" label="Padrão de recorrência">
          <Input
            v-model="form.recurrence_pattern"
            placeholder="Ex: mensal, semanal, anual..."
            class="h-9"
          />
        </AppFormField>
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
