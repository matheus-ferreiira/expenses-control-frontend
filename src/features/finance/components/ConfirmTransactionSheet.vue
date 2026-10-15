<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckCircle2, Loader2 } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { financeApi } from '@/services/api/finance'
import { useToast } from '@/composables/useToast'
import { toISODate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'

/**
 * Confirms a forecast with what really happened: amount and date start at the forecast and can be
 * adjusted. A forecast dated in the future is confirmed with today's date (the API refuses future dates).
 */
const props = defineProps<{ open: boolean; transaction: Transaction | null }>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirmed: [transaction: Transaction]
}>()

const toast = useToast()
const amount = ref('')
const date = ref('')
const saving = ref(false)
const error = ref<string | null>(null)
const today = computed(() => toISODate(new Date()))
const isIncome = computed(() => props.transaction?.type === 'income')

watch(
  () => [props.open, props.transaction] as const,
  ([open, t]) => {
    if (!open || !t) return
    amount.value = t.amount.toFixed(2).replace('.', ',')
    date.value = t.transaction_date > today.value ? today.value : t.transaction_date
    error.value = null
  },
  { immediate: true },
)

const parsedAmount = computed(() => parseFloat(amount.value.replace(/\./g, '').replace(',', '.')))

async function submit() {
  const t = props.transaction
  if (!t || saving.value) return
  if (!(parsedAmount.value > 0)) {
    error.value = 'Informe o valor'
    return
  }
  if (!date.value || date.value > today.value) {
    error.value = 'A data não pode ser futura'
    return
  }
  saving.value = true
  try {
    const updated = await financeApi.transactions.confirm(t.id, { amount: parsedAmount.value, date: date.value })
    emit('confirmed', updated)
    emit('update:open', false)
  } catch (e: unknown) {
    const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(message ?? 'Não foi possível confirmar. Tente novamente.')
  } finally {
    saving.value = false
  }
}

function cancel() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open && transaction" class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-background backdrop-blur-sm" @click="cancel" />

        <form class="relative w-full sm:max-w-sm bg-card rounded-t-lg sm:rounded-lg p-5 pb-safe" @submit.prevent="submit">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-primary shrink-0">
              <CheckCircle2 :size="16" />
            </div>
            <div class="min-w-0">
              <h3 class="text-[14px] font-semibold text-foreground">{{ isIncome ? 'Recebi' : 'Paguei' }}</h3>
              <p class="text-[11px] text-muted-foreground mt-0.5 truncate">
                {{ transaction.description }} · previsto {{ formatCurrency(transaction.amount) }}
              </p>
            </div>
          </div>

          <div class="space-y-3 mb-4">
            <label class="block">
              <span class="text-[11px] font-medium text-muted-foreground">Valor {{ isIncome ? 'recebido' : 'pago' }}</span>
              <input
                v-model="amount"
                inputmode="decimal"
                class="mt-1 w-full h-11 rounded-lg bg-muted px-3 text-[15px] font-semibold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label class="block">
              <span class="text-[11px] font-medium text-muted-foreground">Data em que {{ isIncome ? 'recebeu' : 'pagou' }}</span>
              <input
                v-model="date"
                type="date"
                :max="today"
                class="mt-1 w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <p v-if="error" class="text-[12px] text-destructive">{{ error }}</p>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 h-10 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors"
              @click="cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-[14px] font-semibold hover:brightness-110 transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Loader2 v-if="saving" :size="14" class="animate-spin" />
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
