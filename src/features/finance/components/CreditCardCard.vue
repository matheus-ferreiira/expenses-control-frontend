<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { computed } from 'vue'
import { MoreHorizontal, Pencil, Trash2, CreditCard, Lock, Archive, ArchiveRestore, FileText } from 'lucide-vue-next'
import type { CreditCard as CreditCardType } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { utilizationPercent } from '../utils/financeHelpers'
import type { BillingPeriod } from '../utils/financeHelpers'

const props = defineProps<{
  card: CreditCardType
  /** Amount charged in the current billing period */
  usedAmount?: number
  /** Billing period details — if not provided, falls back to calendar-month display */
  billingPeriod?: BillingPeriod
}>()

const emit = defineEmits<{
  edit: [card: CreditCardType]
  delete: [id: string]
  pay: [card: CreditCardType]
  archive: [card: CreditCardType]
  unarchive: [card: CreditCardType]
  statement: [card: CreditCardType]
}>()

const used = computed(() => props.usedAmount ?? 0)
const utilPct = computed(() => utilizationPercent(used.value, props.card.limit_amount))

/** Days until the due date (uses billing period if available) */
const daysUntilDue = computed(() => {
  const today = new Date()
  const todayMs = today.setHours(0, 0, 0, 0)

  // Use the actual due date from billing period when available
  if (props.billingPeriod) {
    const dueMs = new Date(props.billingPeriod.dueDate + 'T00:00:00').getTime()
    return Math.max(0, Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24)))
  }

  // Fallback: same-month due_day
  const due = props.card.due_day
  const now = new Date()
  if (due >= now.getDate()) return due - now.getDate()
  const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, due)
  return Math.ceil((nextDue.getTime() - todayMs) / (1000 * 60 * 60 * 24))
})

/** Badge color based on days until due */
const dueBadgeClass = computed(() => {
  const d = daysUntilDue.value
  if (d === 0) return 'bg-destructive/20 text-destructive border-destructive/30'
  if (d === 1) return 'bg-destructive/15 text-destructive/80 border-destructive/20'
  if (d <= 5) return 'bg-warning/20 text-warning border-warning/30'
  return 'bg-success/15 text-success/80 border-success/20'
})

const dueBadgeLabel = computed(() => {
  const d = daysUntilDue.value
  if (d === 0) return 'Vence hoje'
  if (d === 1) return 'Vence amanhã'
  return `Vence em ${d} dias`
})

/** Limit bar color based on utilization percentage */
const limitBarClass = computed(() => {
  if (utilPct.value < 50) return 'bg-success'
  if (utilPct.value < 76) return 'bg-warning'
  return 'bg-destructive'
})


</script>

<template>
  <div class="rounded-lg border border-border/50 bg-card overflow-hidden flex flex-col" :class="!card.is_active ? 'opacity-50' : ''">
    <!-- Color accent top bar -->
    <div class="h-[3px] w-full" :style="{ background: card.color }" />

    <div class="p-3.5 flex flex-col gap-2.5 flex-1">
      <!-- Header: avatar + name + menu -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="rounded-lg grid place-items-center shrink-0 w-8 h-8 text-[11px] font-bold text-white"
            :style="{ background: card.color }"
          >
            {{ card.name.substring(0, 2).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-foreground truncate">{{ card.name }}</p>
            <!-- Billing period label (or fallback to closing/due days) -->
            <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mt-0.5">
              <template v-if="billingPeriod">
                {{ billingPeriod.label }}
              </template>
              <template v-else>
                Fecha dia {{ card.closing_day }} · Vence dia {{ card.due_day }}
              </template>
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="min-h-[44px] min-w-[44px] shrink-0 -mr-2 -mt-1">
              <MoreHorizontal :size="13" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-36">
            <DropdownMenuItem v-if="card.is_active" @click="emit('edit', card)">
              <Pencil :size="12" class="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="card.is_active" />
            <DropdownMenuItem v-if="card.is_active" @click="emit('archive', card)">
              <Archive :size="12" class="mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem v-else @click="emit('unarchive', card)">
              <ArchiveRestore :size="12" class="mr-2" />
              Desarquivar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click="emit('delete', card.id)"
            >
              <Trash2 :size="12" class="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Status badges row -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <!-- Due date badge -->
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium"
          :class="dueBadgeClass"
        >
          <CreditCard :size="9" />
          {{ dueBadgeLabel }}
        </span>

        <!-- "Fatura fechada" badge when billing cycle has already closed -->
        <span
          v-if="billingPeriod?.isClosed"
          :title="`Período encerrado. Pagamento até ${new Date(billingPeriod.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}.`"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium bg-muted/60 text-muted-foreground/70 border-border/50 cursor-help"
        >
          <Lock :size="9" />
          Fatura fechada
        </span>
      </div>

      <!-- Limit + usage bar -->
      <div class="pt-1.5 border-t border-border/40">
        <div class="flex items-end justify-between mb-1.5">
          <div>
            <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mb-0.5">
              {{ billingPeriod?.isClosed ? 'Fatura fechada' : 'Fatura atual' }}
            </p>
            <p class="text-[17px] font-semibold tabular-nums leading-none text-foreground">
              {{ formatCurrency(card.limit_amount) }}
            </p>
          </div>
          <span class="text-[11px] text-muted-foreground/50 tabular-nums">
            {{ utilPct }}% usado
          </span>
        </div>
        <!-- Utilization bar -->
        <div class="h-1.5 bg-muted/60 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="limitBarClass"
            :style="{ width: `${utilPct}%` }"
          />
        </div>
        <p v-if="used > 0" class="text-[10px] text-muted-foreground/40 mt-1 tabular-nums">
          {{ formatCurrency(used) }} de {{ formatCurrency(card.limit_amount) }}
        </p>
      </div>

      <!-- Action buttons row -->
      <div class="flex gap-1.5 mt-0.5">
        <!-- Ver extrato — always visible -->
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-medium border border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60 transition-colors"
          @click="emit('statement', card)"
        >
          <FileText :size="13" />
          Ver extrato
        </button>
      </div>
    </div>
  </div>
</template>
