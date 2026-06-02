<script setup lang="ts">
import { computed, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Input } from '@ui/input'
import { Loader2, Wallet, Landmark, PiggyBank, TrendingUp, DollarSign, ArrowLeft } from 'lucide-vue-next'
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
const { form, errors, submitting, isFormValid, fromAccount, reset, validate, toPayload } = useAccountForm()

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
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border/50 shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
          @click="close"
        >
          <ArrowLeft :size="18" />
        </button>
        <h3 class="text-[15px] font-semibold leading-none">
          {{ account ? 'Editar conta' : 'Nova conta' }}
        </h3>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Live preview card -->
        <div class="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <span
            class="flex items-center justify-center size-9 rounded-lg shrink-0"
            :style="{ background: form.color ? form.color + '26' : 'hsl(var(--muted))', color: form.color ?? 'hsl(var(--muted-foreground))' }"
          >
            <component :is="previewIcon" :size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[14px] font-medium truncate text-foreground">
              {{ form.name || 'Nome da conta' }}
            </p>
            <p class="text-[12px] text-muted-foreground">{{ ACCOUNT_TYPE_LABELS[form.type] }}</p>
          </div>
          <p class="text-[16px] font-semibold tabular-nums shrink-0 text-foreground">
            {{ previewBalance }}
          </p>
        </div>

        <AppFormField label="Nome" :error="errors.name" required>
          <Input v-model="form.name" placeholder="Ex: Itaú Corrente" class="h-10 bg-card border-border/60" />
        </AppFormField>

        <!-- Type selector -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">Tipo</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="t in accountTypes"
              :key="t"
              type="button"
              class="h-10 rounded-lg text-[13px] font-medium border transition-all flex items-center justify-center gap-1.5"
              :class="form.type === t
                ? 'bg-primary/12 border-primary/40 text-primary'
                : 'bg-muted border-border text-muted-foreground'"
              @click="form.type = t"
            >
              <component :is="TYPE_ICONS[t]" :size="14" />
              {{ ACCOUNT_TYPE_LABELS[t] }}
            </button>
          </div>
        </div>

        <AppFormField label="Saldo inicial (R$)" :error="errors.balance">
          <Input
            v-model="form.balance"
            inputmode="decimal"
            placeholder="0,00"
            class="h-10 bg-card border-border/60"
          />
        </AppFormField>

        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">Cor</p>
          <ColorPicker v-model="form.color" />
        </div>

      </div>

      <!-- Footer -->
      <div class="px-4 pt-3 pb-8 border-t border-border/40 shrink-0 flex gap-2">
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl text-[15px] transition-colors bg-muted/60 border border-border/50 text-muted-foreground"
          :disabled="submitting"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex-1 h-[52px] rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!isFormValid || submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ account ? 'Salvar' : 'Criar conta' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
