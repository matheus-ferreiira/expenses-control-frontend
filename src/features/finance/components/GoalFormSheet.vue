<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { useFinanceStore } from '@/stores/finance'
import { formatCurrency } from '@/utils/currency'
import type { FinanceGoal } from '@/types/finance'

const PRESET_COLORS = [
  '#00C896', '#FF4D4D', '#F5A623', '#4A90E2', '#9B59B6',
  '#1ABC9C', '#E74C3C', '#F39C12', '#3498DB', '#8E44AD',
  '#2ECC71', '#E67E22', '#D35400', '#16A085', '#2980B9',
]


const props = defineProps<{
  open: boolean
  goal?: FinanceGoal | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [goal: FinanceGoal, createRecurring: boolean]
  updated: [goal: FinanceGoal]
}>()

const store = useFinanceStore()
const toast = useToast()
const submitting = ref(false)

const amountInputRef = ref<HTMLInputElement | null>(null)
const contributionInputRef = ref<HTMLInputElement | null>(null)

const form = ref({
  name: '',
  target_amount_raw: '',
  contribution_raw: '',
  deadline: '',
  bank_account_id: '',
  color: PRESET_COLORS[0]!,
})

function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function onAmountInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  form.value.target_amount_raw = digits ? (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',') : ''
  ;(e.target as HTMLInputElement).value = formatAmountDisplay(digits)
}

function onAmountFocus(e: Event) {
  const input = e.target as HTMLInputElement
  setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0)
}

function onContributionInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  form.value.contribution_raw = digits ? (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',') : ''
  ;(e.target as HTMLInputElement).value = formatAmountDisplay(digits)
}

const targetAmount = computed(() => {
  const v = parseFloat(form.value.target_amount_raw.replace(',', '.'))
  return isNaN(v) ? 0 : v
})

const monthlyContribution = computed(() => {
  const v = parseFloat(form.value.contribution_raw.replace(',', '.'))
  return isNaN(v) ? 0 : v
})

const monthsToGoal = computed(() => {
  if (monthlyContribution.value <= 0 || targetAmount.value <= 0) return null
  return Math.ceil(targetAmount.value / monthlyContribution.value)
})

const isFormValid = computed(() =>
  form.value.name.trim().length > 0 && targetAmount.value > 0,
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.goal) {
        form.value = {
          name: props.goal.name,
          target_amount_raw: Number(props.goal.target_amount).toFixed(2).replace('.', ','),
          contribution_raw: Number(props.goal.monthly_contribution).toFixed(2).replace('.', ','),
          deadline: props.goal.deadline ?? '',
          bank_account_id: props.goal.bank_account_id ?? '',
          color: props.goal.color ?? PRESET_COLORS[0]!,
        }
        nextTick(() => {
          if (amountInputRef.value) {
            amountInputRef.value.value = formatAmountDisplay(
              String(Math.round(props.goal!.target_amount * 100)),
            )
          }
          if (contributionInputRef.value) {
            contributionInputRef.value.value = props.goal!.monthly_contribution > 0
              ? formatAmountDisplay(String(Math.round(props.goal!.monthly_contribution * 100)))
              : ''
          }
        })
      } else {
        form.value = {
          name: '',
          target_amount_raw: '',
          contribution_raw: '',
          deadline: '',
          bank_account_id: '',
          color: PRESET_COLORS[0]!,
        }
        nextTick(() => {
          if (amountInputRef.value) amountInputRef.value.value = ''
          if (contributionInputRef.value) contributionInputRef.value.value = ''
        })
      }
      if (!store.activeAccounts.length) store.fetchAccounts()
    }
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!isFormValid.value || submitting.value) return
  submitting.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      target_amount: targetAmount.value,
      monthly_contribution: monthlyContribution.value,
      deadline: form.value.deadline || undefined,
      bank_account_id: form.value.bank_account_id || undefined,
      color: form.value.color,
    }

    if (props.goal) {
      const updated = await store.updateGoal(props.goal.id, payload)
      toast.success('Meta atualizada')
      emit('updated', updated)
      close()
    } else {
      const created = await store.createGoal(payload)
      toast.success('Meta criada')
      emit('created', created, created.create_recurring_transaction)
      close()
    }
  } catch {
    toast.error('Erro ao salvar meta')
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
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 pt-3 pb-4 border-b border-border/50 shrink-0">
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
          @click="close"
        >
          <ArrowLeft :size="18" aria-hidden="true" />
        </button>
        <h3 class="text-[15px] font-semibold leading-none">
          {{ goal ? 'Editar meta' : 'Nova meta' }}
        </h3>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Nome -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Nome da meta <span class="text-destructive">*</span>
          </p>
          <input
            v-model="form.name"
            type="text"
            placeholder="Ex: Viagem para Europa, Reserva de emergência..."
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          />
        </div>

        <!-- Valor alvo -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Valor alvo (R$) <span class="text-destructive">*</span>
          </p>
          <div class="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-border/60 focus-within:border-primary/60 transition-colors">
            <span class="text-[12px] text-muted-foreground/60 shrink-0">R$</span>
            <input
              ref="amountInputRef"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground/40"
              @input="onAmountInput"
              @focus="onAmountFocus"
            />
          </div>
        </div>

        <!-- Contribuição mensal -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Contribuição mensal (R$)
          </p>
          <div class="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-border/60 focus-within:border-primary/60 transition-colors">
            <span class="text-[12px] text-muted-foreground/60 shrink-0">R$</span>
            <input
              ref="contributionInputRef"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground/40"
              @input="onContributionInput"
              @focus="onAmountFocus"
            />
          </div>
          <p v-if="monthsToGoal" class="text-[11px] text-primary/70 mt-1">
            Em {{ monthsToGoal }} {{ monthsToGoal === 1 ? 'mês' : 'meses' }} você atingirá a meta
          </p>
        </div>

        <!-- Prazo -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Prazo (opcional)
          </p>
          <input
            v-model="form.deadline"
            type="date"
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60"
          />
        </div>

        <!-- Conta vinculada -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Conta vinculada (opcional)
          </p>
          <div class="relative">
            <select
              v-model="form.bank_account_id"
              class="w-full h-10 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
              :class="!form.bank_account_id ? 'text-muted-foreground/50' : ''"
            >
              <option value="">Sem conta vinculada (apenas controle visual)</option>
              <option
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                :value="acc.id"
              >
                {{ acc.name }} · {{ formatCurrency(acc.balance) }}
              </option>
            </select>
            <ChevronDown
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            />
          </div>
          <p class="text-[11px] text-muted-foreground/50 mt-1">
            Se vinculada, o progresso reflete o saldo atual da conta
          </p>
        </div>

        <!-- Cor -->
        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">
            Cor
          </p>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in PRESET_COLORS"
              :key="color"
              type="button"
              class="w-7 h-7 rounded-full transition-all"
              :class="form.color === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'hover:scale-110'"
              :style="{ background: color }"
              @click="form.color = color"
            />
          </div>
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
          {{ goal ? 'Salvar' : 'Criar meta' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
