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
import type { BankAccount, AccountType } from '@/types/finance'
import { ACCOUNT_TYPE_LABELS } from '@/types/finance'
import { ACCOUNT_COLORS } from '../types'
import { useAccountForm } from '../composables/useAccountForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  account?: BankAccount | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [account: BankAccount]
  updated: [account: BankAccount]
}>()

const store = useFinanceStore()
const toast = useToast()
const { form, errors, submitting, fromAccount, reset, validate, toPayload } = useAccountForm()

const accountTypes: AccountType[] = ['checking', 'savings', 'investment', 'wallet']

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.account) fromAccount(props.account)
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
    if (props.account) {
      const updated = await store.updateAccount(props.account.id, toPayload())
      emit('updated', updated)
      toast.success('Conta atualizada')
    } else {
      const created = await store.createAccount(toPayload())
      emit('created', created)
      toast.success('Conta criada')
    }
    close()
  } catch {
    toast.error('Erro ao salvar conta')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ account ? 'Editar conta' : 'Nova conta' }}</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <AppFormField label="Nome" :error="errors.name" required>
          <Input v-model="form.name" placeholder="Ex: Itaú Corrente" class="h-9" />
        </AppFormField>

        <AppFormField label="Tipo">
          <Select v-model="form.type">
            <SelectTrigger class="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in accountTypes" :key="t" :value="t">
                {{ ACCOUNT_TYPE_LABELS[t] }}
              </SelectItem>
            </SelectContent>
          </Select>
        </AppFormField>

        <AppFormField label="Saldo inicial (R$)" :error="errors.balance">
          <Input
            v-model="form.balance"
            inputmode="decimal"
            placeholder="0,00"
            class="h-9"
          />
        </AppFormField>

        <!-- Color palette -->
        <AppFormField label="Cor">
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in ACCOUNT_COLORS"
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
          {{ account ? 'Salvar' : 'Criar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
