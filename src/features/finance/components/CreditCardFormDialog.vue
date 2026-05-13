<script setup lang="ts">
import { watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { Loader2 } from 'lucide-vue-next'
import { AppFormField } from '@/components/shared'
import type { CreditCard, CreditCardNetwork } from '@/types/finance'
import { CARD_COLORS, NETWORK_LABELS } from '../types'
import { useCreditCardForm } from '../composables/useCreditCardForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  card?: CreditCard | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [card: CreditCard]
  updated: [card: CreditCard]
}>()

const store = useFinanceStore()
const toast = useToast()
const { form, errors, submitting, fromCard, reset, validate, toPayload } = useCreditCardForm()

const networks: CreditCardNetwork[] = ['visa', 'mastercard', 'elo', 'amex', 'other']

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.card) fromCard(props.card)
      else reset()
    }
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    if (props.card) {
      const updated = await store.updateCard(props.card.id, toPayload())
      emit('updated', updated)
      toast.success('Cartão atualizado')
    } else {
      const created = await store.createCard(toPayload())
      emit('created', created)
      toast.success('Cartão criado')
    }
    close()
  } catch {
    toast.error('Erro ao salvar cartão')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ card ? 'Editar cartão' : 'Novo cartão' }}</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <AppFormField label="Nome" :error="errors.name" required>
          <Input v-model="form.name" placeholder="Ex: Nubank" class="h-9" />
        </AppFormField>

        <AppFormField label="Bandeira">
          <Select v-model="form.network">
            <SelectTrigger class="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="n in networks" :key="n" :value="n">
                {{ NETWORK_LABELS[n] }}
              </SelectItem>
            </SelectContent>
          </Select>
        </AppFormField>

        <AppFormField label="Limite (R$)" :error="errors.credit_limit" required>
          <Input v-model="form.credit_limit" inputmode="decimal" placeholder="0,00" class="h-9" />
        </AppFormField>

        <AppFormField label="Fatura atual (R$)">
          <Input v-model="form.current_balance" inputmode="decimal" placeholder="0,00" class="h-9" />
        </AppFormField>

        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Fecha dia" :error="errors.closing_day" required>
            <Input v-model="form.closing_day" inputmode="numeric" placeholder="1" class="h-9" />
          </AppFormField>
          <AppFormField label="Vence dia" :error="errors.due_day" required>
            <Input v-model="form.due_day" inputmode="numeric" placeholder="10" class="h-9" />
          </AppFormField>
        </div>

        <!-- Color palette -->
        <AppFormField label="Cor">
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in CARD_COLORS"
              :key="color"
              type="button"
              :class="[
                'h-6 w-6 rounded-full border-2 transition-all',
                form.color === color ? 'border-foreground scale-110' : 'border-transparent',
              ]"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            />
          </div>
        </AppFormField>
      </form>

      <DialogFooter class="gap-2">
        <Button variant="outline" :disabled="submitting" @click="close">Cancelar</Button>
        <Button :disabled="submitting" @click="submit">
          <Loader2 v-if="submitting" :size="14" class="mr-1.5 animate-spin" />
          {{ card ? 'Salvar' : 'Criar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
