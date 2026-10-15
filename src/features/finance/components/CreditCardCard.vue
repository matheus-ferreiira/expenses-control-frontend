<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { Skeleton } from '@ui/skeleton'
import { computed } from 'vue'
import { MoreHorizontal, Pencil, Trash2, Archive, ArchiveRestore, FileText } from 'lucide-vue-next'
import type { CardOverview, CreditCard as CreditCardType } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { cycleLabel, statementStatusInfo, type StatementTone } from '../utils/financeHelpers'

const props = defineProps<{
  card: CreditCardType
  /** Resumo calculado no backend; null enquanto carrega ou para cartões arquivados */
  overview?: CardOverview | null
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: [card: CreditCardType]
  delete: [id: string]
  archive: [card: CreditCardType]
  unarchive: [card: CreditCardType]
  /** Abre o extrato; `cycle` indica a fatura (YYYY-MM) a mostrar primeiro */
  statement: [card: CreditCardType, cycle?: string]
}>()

const toPay = computed(() => props.overview?.to_pay[0] ?? null)
const toPayInfo = computed(() => (toPay.value ? statementStatusInfo(toPay.value, props.overview?.today) : null))
const openInfo = computed(() => (props.overview ? statementStatusInfo(props.overview.open, props.overview.today) : null))

const usedPct = computed(() => {
  const o = props.overview
  if (!o || o.limit_cents <= 0) return 0
  return Math.min(100, Math.round((o.used_cents / o.limit_cents) * 100))
})

const limitBarClass = computed(() => {
  if (usedPct.value >= 90) return 'bg-destructive'
  if (usedPct.value >= 70) return 'bg-warning'
  return 'bg-primary'
})

function toneClass(tone: StatementTone): string {
  if (tone === 'danger') return 'text-destructive'
  if (tone === 'warn') return 'text-warning'
  if (tone === 'ok') return 'text-success'
  return 'text-muted-foreground'
}

const money = (cents: number) => formatCurrency(cents / 100)
</script>

<template>
  <div class="rounded-lg bg-card flex flex-col" :class="!card.is_active ? 'opacity-50' : ''">
    <div class="p-3.5 flex flex-col gap-3 flex-1">
      <!-- Header: avatar + name + menu -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="rounded-lg grid place-items-center shrink-0 size-9 text-[11px] font-semibold text-foreground"
            :style="{ background: card.color }"
          >
            {{ card.name.substring(0, 2).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="text-[14px] font-medium text-foreground truncate">{{ card.name }}</p>
            <p class="text-[12px] text-muted-foreground mt-0.5">
              Fecha dia {{ card.closing_day }} · Vence dia {{ card.due_day }}
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

      <!-- Loading -->
      <div v-if="loading && !overview" class="space-y-2">
        <Skeleton class="h-14 w-full rounded-md" />
        <Skeleton class="h-10 w-full rounded-md" />
      </div>

      <template v-else-if="overview">
        <!-- Fatura a pagar (fechada / parcial / vencida) -->
        <button
          v-if="toPay && toPayInfo"
          type="button"
          class="w-full text-left rounded-md bg-muted px-3 py-2.5 flex items-center justify-between gap-3 hover:brightness-110 transition-all"
          @click="emit('statement', card, toPay.cycle)"
        >
          <div class="min-w-0">
            <p class="text-[12px] text-muted-foreground">Fatura a pagar · {{ cycleLabel(toPay.cycle) }}</p>
            <p class="text-[20px] font-semibold tabular-nums leading-tight text-foreground mt-0.5">
              {{ money(toPay.remaining_cents) }}
            </p>
            <p class="text-[12px] font-medium mt-0.5" :class="toneClass(toPayInfo.tone)">{{ toPayInfo.label }}</p>
          </div>
          <span class="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold grid place-items-center shrink-0">
            Pagar
          </span>
        </button>
        <p v-if="overview.to_pay.length > 1" class="text-[12px] text-warning -mt-1.5">
          + {{ overview.to_pay.length - 1 }} outra(s) fatura(s) em aberto
        </p>

        <!-- Fatura aberta -->
        <button
          type="button"
          class="w-full text-left flex items-center justify-between gap-3"
          @click="emit('statement', card, overview.open_cycle)"
        >
          <div>
            <p class="text-[12px] text-muted-foreground">Fatura aberta · {{ cycleLabel(overview.open_cycle) }}</p>
            <p class="text-[12px] text-muted-foreground">{{ openInfo?.label }}</p>
          </div>
          <p class="text-[16px] font-semibold tabular-nums text-foreground">{{ money(overview.open.charges_cents) }}</p>
        </button>

        <!-- Limite real -->
        <div class="pt-2.5 border-t border-border">
          <div class="flex items-baseline justify-between mb-1.5">
            <p class="text-[12px] text-muted-foreground">Limite disponível</p>
            <p class="text-[14px] font-semibold tabular-nums text-foreground">
              {{ money(overview.available_cents) }}
              <span class="text-[12px] font-normal text-muted-foreground">de {{ money(overview.limit_cents) }}</span>
            </p>
          </div>
          <div class="h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" :class="limitBarClass" :style="{ width: `${usedPct}%` }" />
          </div>
          <p class="text-[12px] text-muted-foreground mt-1 tabular-nums">
            {{ usedPct }}% usado · inclui faturas a pagar, a aberta e parcelas futuras
          </p>
        </div>

        <!-- Próximas faturas (parcelas e assinaturas já lançadas) -->
        <div v-if="overview.upcoming.length" class="pt-2.5 border-t border-border">
          <div class="flex items-baseline justify-between mb-1.5">
            <p class="text-[12px] text-muted-foreground">Já comprometido nas próximas faturas</p>
            <p class="text-[13px] font-semibold tabular-nums text-foreground">{{ money(overview.upcoming_total_cents) }}</p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="s in overview.upcoming.slice(0, 4)"
              :key="s.cycle"
              type="button"
              class="h-8 px-2.5 rounded-md bg-muted text-[12px] tabular-nums text-foreground hover:brightness-110"
              @click="emit('statement', card, s.cycle)"
            >
              {{ cycleLabel(s.cycle) }} · {{ money(s.charges_cents) }}
            </button>
          </div>
        </div>
      </template>

      <!-- Extrato -->
      <button
        type="button"
        class="w-full flex items-center justify-center gap-1.5 h-10 rounded-lg text-[13px] font-medium bg-muted text-foreground hover:brightness-110 transition-colors"
        @click="emit('statement', card)"
      >
        <FileText :size="14" />
        Ver extrato
      </button>
    </div>
  </div>
</template>
