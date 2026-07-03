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
import { MoreHorizontal, Pencil, Trash2, CreditCard, Archive, ArchiveRestore, FileText, AlertTriangle } from 'lucide-vue-next'
import type { CreditCard as CreditCardType } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { utilizationPercent, formatDayMonth } from '../utils/financeHelpers'
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

/** True when the due date has already passed */
const isOverdue = computed(() => {
  const today = new Date()
  const todayMs = today.setHours(0, 0, 0, 0)
  if (props.billingPeriod) {
    return new Date(props.billingPeriod.dueDate + 'T00:00:00').getTime() < todayMs
  }
  const due = props.card.due_day
  return due < new Date().getDate()
})

const dueBadgeLabel = computed(() => {
  if (isOverdue.value) return 'Vencida'
  const d = daysUntilDue.value
  if (d === 0) return 'Vence hoje'
  if (d === 1) return 'Vence amanhã'
  return `Vence em ${d} dias`
})

/** "Fecha dia 13 jul · Vence dia 20 jul" — explicit dates, not the ambiguous open-cycle range */
const closingDueLabel = computed(() => {
  if (props.billingPeriod) {
    return `Fecha dia ${formatDayMonth(props.billingPeriod.endDate)} · Vence dia ${formatDayMonth(props.billingPeriod.dueDate)}`
  }
  return `Fecha dia ${props.card.closing_day} · Vence dia ${props.card.due_day}`
})

/** Limit bar color based on utilization percentage */
const limitBarClass = computed(() => {
  if (utilPct.value >= 90) return 'bg-destructive'
  if (utilPct.value >= 70) return 'bg-warning'
  return 'bg-primary'
})


</script>

<template>
  <div class="rounded-lg bg-card flex flex-col" :class="!card.is_active ? 'opacity-50' : ''">
    <div class="p-3.5 flex flex-col gap-2.5 flex-1">
      <!-- Header: avatar + name + menu -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Avatar with solid card color (the only place color appears) -->
          <span
            class="rounded-lg grid place-items-center shrink-0 size-9 text-[11px] font-semibold text-foreground"
            :style="{ background: card.color }"
          >
            {{ card.name.substring(0, 2).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-foreground truncate">{{ card.name }}</p>
            <!-- Closing/due dates — explicit, not the billing-period range -->
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              {{ closingDueLabel }}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" aria-label="Opções do cartão" class="min-h-[44px] min-w-[44px] shrink-0 -mr-2 -mt-1">
              <MoreHorizontal :size="13" aria-hidden="true" />
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
        <!-- Due date badge — semantic colors, rounded (4px) -->
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium "
          :class="isOverdue
            ? 'bg-muted text-destructive'
            : daysUntilDue <= 5
              ? 'bg-muted text-warning'
              : 'bg-muted text-primary'"
        >
          <AlertTriangle v-if="isOverdue" :size="9" />
          <CreditCard v-else :size="9" />
          {{ dueBadgeLabel }}
        </span>
      </div>

      <!-- Limit + usage bar -->
      <div class="pt-1.5 border-t border-border">
        <div class="flex items-end justify-between mb-1.5">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
              Fatura atual
            </p>
            <p class="text-[17px] font-semibold tabular-nums leading-none text-foreground">
              {{ formatCurrency(used) }}
            </p>
          </div>
          <span class="text-[11px] text-muted-foreground tabular-nums">
            de {{ formatCurrency(card.limit_amount) }}
          </span>
        </div>
        <!-- Utilization bar -->
        <div class="h-2 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="limitBarClass"
            :style="{ width: `${utilPct}%` }"
          />
        </div>
        <p class="text-[10px] text-muted-foreground mt-1 tabular-nums">
          {{ utilPct }}% do limite
        </p>
      </div>

      <!-- Action buttons row -->
      <div class="flex gap-1.5 mt-0.5">
        <!-- Ver extrato — always visible -->
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[13px] font-medium bg-card text-foreground hover:bg-popover transition-colors"
          @click="emit('statement', card)"
        >
          <FileText :size="14" />
          Ver extrato
        </button>
      </div>
    </div>
  </div>
</template>
