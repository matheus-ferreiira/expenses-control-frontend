<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { X, Pencil, Trash2, ArrowUp, ArrowDown, ArrowLeftRight, Clock, Repeat, CheckCircle2, Copy } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'
import { financeApi } from '@/services/api/finance'

const props = defineProps<{
  transaction: Transaction | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [transaction: Transaction]
  duplicate: [transaction: Transaction]
  delete: [id: string]
  confirmed: [transaction: Transaction]
}>()

const confirming = ref(false)
async function handleConfirm() {
  if (!props.transaction || confirming.value) return
  confirming.value = true
  try {
    const updated = await financeApi.transactions.confirm(props.transaction.id)
    emit('confirmed', updated)
    close()
  } finally {
    confirming.value = false
  }
}

function close() {
  emit('update:open', false)
}

function onEdit() {
  if (props.transaction) {
    emit('edit', props.transaction)
    close()
  }
}

function onDelete() {
  if (props.transaction) {
    emit('delete', props.transaction.id)
    close()
  }
}

function onDuplicate() {
  if (props.transaction) {
    emit('duplicate', props.transaction)
    close()
  }
}

// Format date safely — parse YYYY-MM-DD as local time to avoid UTC timezone shift
function formatTransactionDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const typeBadge = computed(() => {
  const t = props.transaction
  if (!t) return null
  if (t.is_recurring) return { label: 'Fix', cls: 'bg-primary/12 border-primary/25 text-primary', icon: 'repeat' }
  if (t.status === 'pending') return { label: 'Agendada', cls: 'bg-warning/10 border-warning/25 text-warning', icon: 'clock' }
  if (t.type === 'income') return { label: 'Receita', cls: 'bg-primary/12 border-primary/25 text-primary', icon: null }
  if (t.type === 'expense') return { label: 'Despesa', cls: 'bg-destructive/12 border-destructive/25 text-destructive', icon: null }
  return { label: 'Transferência', cls: 'bg-white/[0.07] border-white/15 text-muted-foreground', icon: null }
})

const swatchStyle = computed(() => {
  const t = props.transaction
  if (!t) return {}
  if (t.category?.color) return { background: t.category.color + '22', color: t.category.color }
  if (t.type === 'income') return { background: 'hsl(var(--success) / 0.13)', color: 'hsl(var(--success))' }
  if (t.type === 'expense') return { background: 'hsl(var(--destructive) / 0.13)', color: 'hsl(var(--destructive))' }
  return { background: 'hsl(var(--muted) / 0.6)', color: 'hsl(var(--muted-foreground))' }
})

const amountClass = computed(() => {
  const t = props.transaction
  if (!t) return ''
  if (t.type === 'income') return 'text-success'
  if (t.type === 'expense') return 'text-destructive'
  return 'text-muted-foreground'
})
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-lg max-h-[88vh] overflow-y-auto p-0 border-t border-border focus:outline-none [&>button]:hidden"
    >
      <template v-if="transaction">
        <!-- Drag handle -->
        <div class="flex justify-center pt-3 pb-1 shrink-0">
          <div class="w-10 h-1 rounded-full bg-border/60" />
        </div>

        <!-- Header: type badge + close -->
        <div class="flex items-center justify-between px-5 pt-2 pb-3">
          <span
            v-if="typeBadge"
            class="inline-flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-semibold border"
            :class="typeBadge.cls"
          >
            <Repeat v-if="typeBadge.icon === 'repeat'" :size="10" />
            <Clock v-else-if="typeBadge.icon === 'clock'" :size="10" />
            {{ typeBadge.label }}
          </span>
          <button
            type="button"
            class="size-7 rounded-full grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
            @click="close"
          >
            <X :size="15" />
          </button>
        </div>

        <!-- Category icon + description + amount -->
        <div class="flex flex-col items-center gap-3 px-5 pb-6">
          <span
            class="rounded-lg grid place-items-center w-14 h-14"
            :style="swatchStyle"
          >
            <component
              v-if="transaction.category?.icon && findIcon(transaction.category.icon)"
              :is="findIcon(transaction.category.icon)!.component"
              :size="28"
              :stroke-width="1.7"
            />
            <ArrowLeftRight v-else-if="transaction.type === 'transfer'" :size="24" :stroke-width="1.7" />
            <span v-else class="text-xl font-bold">{{ transaction.description.charAt(0).toUpperCase() }}</span>
          </span>

          <div class="text-center">
            <p class="text-base font-semibold text-foreground leading-snug">{{ transaction.description }}</p>
            <p class="text-3xl font-bold tabular-nums mt-1.5 leading-none" :class="amountClass">
              <ArrowUp v-if="transaction.type === 'income'" :size="20" class="inline mr-0.5 opacity-70 align-middle" />
              <ArrowDown v-else-if="transaction.type === 'expense'" :size="20" class="inline mr-0.5 opacity-70 align-middle" />
              {{ formatCurrency(transaction.amount) }}
            </p>
          </div>
        </div>

        <!-- Details card -->
        <div class="mx-4 mb-4 bg-card rounded-lg overflow-hidden">
          <!-- Date -->
          <div class="flex items-start justify-between px-4 py-3.5 gap-4 border-b border-white/5">
            <span class="text-sm text-muted-foreground shrink-0">Data</span>
            <span class="text-sm font-medium text-foreground text-right capitalize">
              {{ formatTransactionDate(transaction.transaction_date) }}
            </span>
          </div>

          <!-- Category -->
          <div v-if="transaction.category" class="flex items-center justify-between px-4 py-3.5 gap-4 border-b border-white/5">
            <span class="text-sm text-muted-foreground shrink-0">Categoria</span>
            <span class="text-sm font-medium text-foreground text-right">{{ transaction.category.name }}</span>
          </div>

          <!-- Account / Card -->
          <div v-if="transaction.account || transaction.card" class="flex items-center justify-between px-4 py-3.5 gap-4 border-b border-white/5">
            <span class="text-sm text-muted-foreground shrink-0">{{ transaction.card ? 'Cartão' : 'Conta' }}</span>
            <span class="text-sm font-medium text-foreground text-right">
              {{ transaction.account?.name ?? transaction.card?.name }}
            </span>
          </div>

          <!-- Status -->
          <div class="flex items-center justify-between px-4 py-3.5 gap-4 border-b border-white/5">
            <span class="text-sm text-muted-foreground shrink-0">Status</span>
            <span
              class="inline-flex items-center gap-1 text-sm font-medium"
              :class="transaction.status === 'pending' ? 'text-muted-foreground' : 'text-success'"
            >
              <Clock v-if="transaction.status === 'pending'" :size="12" />
              {{ transaction.status === 'pending' ? 'Agendada' : 'Confirmada' }}
            </span>
          </div>

          <!-- Fix indicator with frequency -->
          <div v-if="transaction.is_recurring" class="flex items-center justify-between px-4 py-3.5 gap-4 border-b border-white/5">
            <span class="text-sm text-muted-foreground shrink-0">Tipo</span>
            <span class="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <Repeat :size="12" />
              Fix
              <template v-if="(transaction.recurrence_config as Record<string,unknown> | null)?.frequency">
                · {{ ({
                  weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal',
                  bimonthly: 'Bimestral', quarterly: 'Trimestral',
                  semiannual: 'Semestral', annual: 'Anual',
                } as Record<string, string>)[(transaction.recurrence_config as Record<string,unknown>).frequency as string] ?? 'Mensal' }}
              </template>
            </span>
          </div>

          <!-- Installment indicator -->
          <div
            v-if="transaction.installment_number && transaction.total_installments"
            class="flex items-center justify-between px-4 py-3.5 gap-4 border-b border-white/5"
          >
            <span class="text-sm text-muted-foreground shrink-0">Parcela</span>
            <span class="text-sm font-semibold tabular-nums text-right">
              {{ transaction.installment_number }} de {{ transaction.total_installments }}
            </span>
          </div>

          <!-- Notes -->
          <div v-if="transaction.notes" class="px-4 py-3.5 border-b border-white/5">
            <p class="text-sm text-muted-foreground mb-1.5">Observações</p>
            <p class="text-sm text-foreground leading-relaxed">{{ transaction.notes }}</p>
          </div>

          <!-- Tags -->
          <div v-if="transaction.tags && transaction.tags.length > 0" class="px-4 py-3.5">
            <p class="text-sm text-muted-foreground mb-2">Tags</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in transaction.tags"
                :key="tag.id"
                class="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium text-white"
                :style="{ background: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="grid gap-2 px-4 pt-1 pb-8">
          <!-- "Marcar como paga" — only for pending transactions -->
          <button
            v-if="transaction.status === 'pending'"
            type="button"
            :disabled="confirming"
            class="h-11 rounded-md bg-success text-background text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-60"
            @click="handleConfirm"
          >
            <CheckCircle2 :size="16" />
            {{ confirming ? 'Confirmando...' : 'Marcar como paga' }}
          </button>
          <div class="grid grid-cols-3 gap-2">
            <!-- Excluir -->
            <button
              type="button"
              class="flex flex-col items-center justify-center gap-1.5 h-11 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 hover:opacity-80 bg-white/5 border-white/[0.08] text-destructive"
              @click="onDelete"
            >
              <Trash2 :size="16" />
              Excluir
            </button>
            <!-- Duplicar -->
            <button
              type="button"
              class="flex flex-col items-center justify-center gap-1.5 h-11 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 hover:opacity-80 bg-white/5 border-white/[0.08] text-muted-foreground"
              @click="onDuplicate"
            >
              <Copy :size="16" />
              Duplicar
            </button>
            <!-- Editar -->
            <button
              type="button"
              class="flex flex-col items-center justify-center gap-1.5 h-11 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 hover:opacity-80 bg-white/5 border-white/[0.08] text-foreground"
              @click="onEdit"
            >
              <Pencil :size="16" />
              Editar
            </button>
          </div>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
