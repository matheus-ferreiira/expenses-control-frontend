<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'
import { Input } from '@ui/input'
import { Loader2, Wifi } from 'lucide-vue-next'
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

const previewLimit = computed(() => {
  const val = parseFloat(form.limit_amount.replace(',', '.'))
  return isNaN(val) || val <= 0 ? 'R$ 0,00' : formatCurrency(val)
})

const previewDue = computed(() => {
  const d = parseInt(form.due_day)
  return isNaN(d) ? '—' : `${d < 10 ? '0' : ''}${d}`
})

const cardGradient = computed(
  () =>
    `linear-gradient(135deg, ${form.color}dd 0%, ${form.color}99 50%, ${form.color}55 100%)`,
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm bg-background border-border">
      <DialogHeader>
        <DialogTitle>{{ card ? 'Editar cartão' : 'Novo cartão' }}</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">

        <!-- Card preview -->
        <div
          class="relative w-full aspect-[1.586] rounded-xl p-5 text-white overflow-hidden shadow-lg"
          :style="{ background: cardGradient }"
        >
          <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div class="absolute -right-2 top-8 w-20 h-20 rounded-full bg-white/5" />

          <div class="flex items-start justify-between mb-auto">
            <p class="text-sm font-semibold truncate flex-1 drop-shadow">
              {{ form.name || 'Nome do Cartão' }}
            </p>
            <Wifi :size="18" class="text-white/70 ml-2 shrink-0" />
          </div>

          <div class="mt-6 mb-4 flex gap-3 font-mono text-sm tracking-widest text-white/60">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>1234</span>
          </div>

          <div class="flex items-end justify-between">
            <div>
              <p class="text-[10px] text-white/50 uppercase tracking-wider">Limite</p>
              <p class="text-sm font-bold tabular-nums">{{ previewLimit }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-white/50 uppercase tracking-wider">Vence dia</p>
              <p class="text-sm font-bold">{{ previewDue }}</p>
            </div>
          </div>
        </div>

        <AppFormField label="Nome" :error="errors.name" required>
          <Input v-model="form.name" placeholder="Ex: Nubank Platinum" class="h-10 bg-card border-border/60" />
        </AppFormField>

        <AppFormField label="Limite (R$)" :error="errors.limit_amount" required>
          <Input v-model="form.limit_amount" inputmode="decimal" placeholder="0,00" class="h-10 bg-card border-border/60" />
        </AppFormField>

        <div class="grid grid-cols-2 gap-3">
          <AppFormField label="Fecha dia" :error="errors.closing_day" required>
            <Input v-model="form.closing_day" inputmode="numeric" placeholder="1" class="h-10 bg-card border-border/60" />
          </AppFormField>
          <AppFormField label="Vence dia" :error="errors.due_day" required>
            <Input v-model="form.due_day" inputmode="numeric" placeholder="10" class="h-10 bg-card border-border/60" />
          </AppFormField>
        </div>

        <div class="space-y-1.5">
          <p class="text-sm font-medium">Cor do cartão</p>
          <ColorPicker v-model="form.color" />
        </div>
      </form>

      <!-- Footer buttons -->
      <div class="flex gap-2 mt-2">
        <button
          type="button"
          class="flex-1 h-11 rounded-lg bg-card border border-white/10 text-muted-foreground text-sm font-medium transition-colors hover:bg-popover"
          :disabled="submitting"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="14" class="animate-spin" />
          {{ card ? 'Salvar' : 'Criar cartão' }}
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
