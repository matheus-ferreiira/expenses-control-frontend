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
import { Loader2, Wallet, Landmark, PiggyBank, TrendingUp, DollarSign } from 'lucide-vue-next'
import { AppFormField, ColorPicker } from '@/components/shared'
import type { BankAccount, AccountType } from '@/types/finance'
import { ACCOUNT_TYPE_LABELS } from '@/types/finance'
import { useAccountForm } from '../composables/useAccountForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'

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

const TYPE_ICONS: Record<AccountType, typeof Wallet> = {
  checking:   Landmark,
  savings:    PiggyBank,
  investment: TrendingUp,
  wallet:     Wallet,
}

const previewIcon = computed(() => TYPE_ICONS[form.type] ?? DollarSign)

const previewBalance = computed(() => {
  const val = parseFloat(form.balance.replace(',', '.'))
  return isNaN(val) ? 'R$ 0,00' : formatCurrency(val)
})

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

        <!-- Live preview card -->
        <div
          class="flex items-center gap-3 p-3 rounded-xl border"
          :style="{ borderColor: form.color + '50', background: form.color + '10' }"
        >
          <span
            class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
            :style="{ backgroundColor: form.color + '25', color: form.color }"
          >
            <component :is="previewIcon" :size="20" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold truncate text-foreground/90">
              {{ form.name || 'Nome da conta' }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ ACCOUNT_TYPE_LABELS[form.type] }}
            </p>
          </div>
          <p class="text-sm font-bold tabular-nums shrink-0" :style="{ color: form.color }">
            {{ previewBalance }}
          </p>
        </div>

        <AppFormField label="Nome" :error="errors.name" required>
          <Input v-model="form.name" placeholder="Ex: Itaú Corrente" class="h-9" />
        </AppFormField>

        <!-- Type pills -->
        <div class="space-y-1.5">
          <p class="text-sm font-medium">Tipo</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="t in accountTypes"
              :key="t"
              type="button"
              :class="[
                'h-8 rounded-md text-xs font-medium border transition-all',
                form.type === t
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/60'
                  : 'border-border text-muted-foreground hover:bg-accent',
              ]"
              @click="form.type = t"
            >
              {{ ACCOUNT_TYPE_LABELS[t] }}
            </button>
          </div>
        </div>

        <AppFormField label="Saldo inicial (R$)" :error="errors.balance">
          <Input
            v-model="form.balance"
            inputmode="decimal"
            placeholder="0,00"
            class="h-9"
          />
        </AppFormField>

        <div class="space-y-1.5">
          <p class="text-sm font-medium">Cor</p>
          <ColorPicker v-model="form.color" />
        </div>
      </form>

      <DialogFooter class="gap-2">
        <Button variant="outline" :disabled="submitting" @click="close">Cancelar</Button>
        <Button :disabled="submitting" @click="submit">
          <Loader2 v-if="submitting" :size="14" class="mr-1.5 animate-spin" />
          {{ account ? 'Salvar' : 'Criar conta' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
