<script setup lang="ts">
import { computed } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Archive, ArchiveRestore, Scale, AlertTriangle, List } from 'lucide-vue-next'
import type { BankAccount } from '@/types/finance'
import { ACCOUNT_TYPE_LABELS } from '@/types/finance'
import { ACCOUNT_TYPE_ICONS } from '@/features/finance/utils/financeHelpers'
import { formatCurrency } from '@/utils/currency'
import { toISODate } from '@/utils/date'

const props = defineProps<{
  account: BankAccount
  /** Cash in and out of the account this month, as the bank statement shows it */
  movement?: { in: number; out: number; monthLabel: string } | null
}>()

const emit = defineEmits<{
  edit: [account: BankAccount]
  delete: [id: string]
  archive: [account: BankAccount]
  unarchive: [account: BankAccount]
  /** Tap on the row: Visão Geral filtered by this account */
  view: [account: BankAccount]
  /** Dated balance check, no transaction created */
  adjust: [account: BankAccount]
}>()

const needsCheck = computed(() => props.account.is_active && props.account.balance_verified === false)

/** Last check the user made: "conferida hoje", "há 3 dias", "15/10" */
const checkedLabel = computed(() => {
  const d = props.account.last_checked_on
  if (!d) return null
  const today = toISODate(new Date())
  const days = Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${d}T12:00:00`).getTime()) / 86_400_000)
  if (days <= 0) return 'conferida hoje'
  if (days === 1) return 'conferida ontem'
  if (days <= 7) return `conferida há ${days} dias`
  const [, m, day] = d.split('-')
  return `conferida em ${day}/${m}`
})

const subtitle = computed(() => [ACCOUNT_TYPE_LABELS[props.account.type], checkedLabel.value].filter(Boolean).join(' · '))
const hasMovement = computed(() => !!props.movement && (props.movement.in > 0 || props.movement.out > 0))
</script>

<template>
  <div
    class="flex items-center gap-3 pl-4 pr-1 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
    :class="!account.is_active ? 'opacity-50' : ''"
    role="button"
    tabindex="0"
    :aria-label="`Ver transações de ${account.name}`"
    @click="emit('view', account)"
    @keydown.enter="emit('view', account)"
  >
    <span
      class="flex items-center justify-center size-9 rounded-lg shrink-0"
      :style="{
        background: account.is_active ? (account.color ?? '#6b7280') + '33' : 'hsl(var(--muted))',
        color: account.is_active ? (account.color ?? '#6b7280') : 'hsl(var(--muted-foreground))',
      }"
    >
      <component :is="ACCOUNT_TYPE_ICONS[account.type]" :size="16" />
    </span>

    <div class="flex-1 min-w-0">
      <div class="flex items-baseline justify-between gap-2">
        <p class="text-[14px] font-medium text-foreground truncate">{{ account.name }}</p>
        <p class="text-[15px] font-semibold tabular-nums whitespace-nowrap" :class="account.balance < 0 ? 'text-destructive' : 'text-foreground'">
          {{ formatCurrency(account.balance) }}
        </p>
      </div>
      <div class="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-0.5 min-w-0">
        <span class="truncate">{{ subtitle }}</span>
        <button
          v-if="needsCheck"
          type="button"
          class="inline-flex items-center gap-1 text-warning font-medium shrink-0 hover:underline"
          @click.stop="emit('adjust', account)"
        >
          <AlertTriangle :size="12" /> Conferir saldo
        </button>
      </div>
      <p v-if="hasMovement" class="text-[11.5px] tabular-nums mt-0.5 text-muted-foreground truncate">
        <span v-if="movement!.in > 0" class="text-success">+{{ formatCurrency(movement!.in) }}</span>
        <span v-if="movement!.in > 0 && movement!.out > 0"> · </span>
        <span v-if="movement!.out > 0">−{{ formatCurrency(movement!.out) }}</span>
        <span> em {{ movement!.monthLabel }}</span>
      </p>
    </div>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          aria-label="Opções da conta"
          class="flex items-center justify-center size-10 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          @click.stop
        >
          <MoreHorizontal :size="15" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-44">
        <DropdownMenuItem v-if="account.is_active" @click="emit('view', account)">
          <List :size="12" class="mr-2" />
          Ver transações
        </DropdownMenuItem>
        <DropdownMenuItem v-if="account.is_active" @click="emit('adjust', account)">
          <Scale :size="12" class="mr-2" />
          Conferir saldo
        </DropdownMenuItem>
        <DropdownMenuItem v-if="account.is_active" @click="emit('edit', account)">
          <Pencil :size="12" class="mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator v-if="account.is_active" />
        <DropdownMenuItem v-if="account.is_active" @click="emit('archive', account)">
          <Archive :size="12" class="mr-2" />
          Arquivar
        </DropdownMenuItem>
        <DropdownMenuItem v-else @click="emit('unarchive', account)">
          <ArchiveRestore :size="12" class="mr-2" />
          Desarquivar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          @click="emit('delete', account.id)"
        >
          <Trash2 :size="12" class="mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
