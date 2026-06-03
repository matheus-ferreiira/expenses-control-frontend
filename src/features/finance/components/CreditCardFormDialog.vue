<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Loader2, Wifi, ChevronDown, ArrowLeft } from 'lucide-vue-next'
import { AppFormField, ColorPicker } from '@/components/shared'
import type { CreditCard } from '@/types/finance'
import { useCreditCardForm } from '../composables/useCreditCardForm'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'

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

const limitInputRef = ref<HTMLInputElement | null>(null)

function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function onLimitInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  form.limit_amount = digits ? (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',') : ''
  ;(e.target as HTMLInputElement).value = formatAmountDisplay(digits)
}

function onLimitFocus(e: Event) {
  const input = e.target as HTMLInputElement
  setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.card) fromCard(props.card)
      else reset()
      if (!store.activeAccounts.length) store.fetchAccounts()
      nextTick(() => {
        if (limitInputRef.value) {
          limitInputRef.value.value = form.limit_amount
            ? formatAmountDisplay(String(Math.round(parseFloat(form.limit_amount.replace(',', '.')) * 100)))
            : ''
        }
      })
    }
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!validate(!!props.card)) return
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

const previewLimit = computed(() => {
  const val = parseFloat(form.limit_amount.replace(',', '.'))
  return isNaN(val) || val <= 0 ? 'R$ 0,00' : formatCurrency(val)
})

const previewDue = computed(() => {
  const d = parseInt(form.due_day)
  return isNaN(d) ? '—' : `${d < 10 ? '0' : ''}${d}`
})
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
          {{ card ? 'Editar cartão' : 'Novo cartão' }}
        </h3>
      </div>

      <!-- Scrollable form body -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        <!-- Card preview -->
        <div class="relative w-full aspect-[1.586] rounded-xl p-5 overflow-hidden bg-card border border-border">
          <!-- Color accent strip -->
          <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" :style="{ background: form.color }" />

          <div class="flex items-start justify-between mb-auto">
            <p class="text-[13px] font-semibold truncate flex-1 text-foreground">
              {{ form.name || 'Nome do Cartão' }}
            </p>
            <Wifi :size="18" class="text-muted-foreground/50 ml-2 shrink-0" />
          </div>

          <div class="mt-6 mb-4 flex gap-3 font-mono text-[13px] tracking-widest text-muted-foreground/40">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>1234</span>
          </div>

          <div class="flex items-end justify-between">
            <div>
              <p class="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Limite</p>
              <p class="text-[13px] font-bold tabular-nums text-foreground">{{ previewLimit }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Vence dia</p>
              <p class="text-[13px] font-bold text-foreground">{{ previewDue }}</p>
            </div>
          </div>
        </div>

        <AppFormField label="Nome" :error="errors.name" required>
          <input
            v-model="form.name"
            type="text"
            placeholder="Ex: Nubank Platinum"
            class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          />
        </AppFormField>

        <AppFormField label="Limite (R$)" :error="errors.limit_amount" required>
          <div class="w-full flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-border/60 focus-within:border-primary/60 transition-colors">
            <span class="text-[12px] text-muted-foreground/60 shrink-0">R$</span>
            <input
              ref="limitInputRef"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="flex-1 bg-transparent text-[13px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground/40"
              @input="onLimitInput"
              @focus="onLimitFocus"
            />
          </div>
        </AppFormField>

        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Fecha dia" :error="errors.closing_day" required>
            <Input v-model="form.closing_day" inputmode="numeric" placeholder="1" class="w-full h-10 rounded-lg text-[13px] text-center bg-card border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary/60" />
          </AppFormField>
          <AppFormField label="Vence dia" :error="errors.due_day" required>
            <Input v-model="form.due_day" inputmode="numeric" placeholder="10" class="w-full h-10 rounded-lg text-[13px] text-center bg-card border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary/60" />
          </AppFormField>
        </div>

        <AppFormField label="Conta bancária" :error="errors.bank_account_id" :required="!card">
          <div class="relative">
            <select
              v-model="form.bank_account_id"
              class="w-full h-10 rounded-lg border border-border/60 bg-card px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
              :class="!form.bank_account_id ? 'text-muted-foreground/50' : ''"
            >
              <option value="" disabled>Selecione a conta que paga este cartão</option>
              <option
                v-for="acc in store.activeAccounts"
                :key="acc.id"
                :value="acc.id"
              >
                {{ acc.name }}
              </option>
            </select>
            <ChevronDown
              :size="14"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            />
          </div>
        </AppFormField>

        <div>
          <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-2">Cor do cartão</p>
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
          :disabled="submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="16" class="animate-spin" />
          {{ card ? 'Salvar' : 'Criar cartão' }}
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
