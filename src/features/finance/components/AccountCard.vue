<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-vue-next'
import type { BankAccount } from '@/types/finance'
import { ACCOUNT_TYPE_LABELS } from '@/types/finance'
import { ACCOUNT_TYPE_ICONS } from '@/features/finance/utils/financeHelpers'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  account: BankAccount
}>()

const emit = defineEmits<{
  edit: [account: BankAccount]
  delete: [id: string]
  archive: [account: BankAccount]
  unarchive: [account: BankAccount]
}>()
</script>

<template>
  <div
    class="rounded-xl bg-card border border-border transition-opacity"
    :class="!account.is_active ? 'opacity-50' : ''"
  >
    <div class="p-4 flex items-start gap-3">
      <!-- Account type icon: 40×40, colored bg 20% opacity -->
      <span
        class="flex items-center justify-center size-10 rounded-xl shrink-0"
        :style="{
          background: account.is_active ? (account.color ?? '#6b7280') + '33' : 'hsl(var(--muted))',
          color: account.is_active ? (account.color ?? '#6b7280') : 'hsl(var(--muted-foreground))',
        }"
      >
        <component :is="ACCOUNT_TYPE_ICONS[account.type]" :size="18" />
      </span>

      <!-- Content: 2 rows -->
      <div class="flex-1 min-w-0">
        <!-- Row 1: name + balance -->
        <div class="flex items-start gap-2 justify-between">
          <p class="text-[15px] font-semibold text-foreground truncate leading-tight">
            {{ account.name }}
          </p>
          <p
            class="text-[16px] font-semibold tabular-nums leading-tight shrink-0"
            :class="account.balance >= 0 ? 'text-success' : 'text-destructive'"
          >
            {{ formatCurrency(account.balance) }}
          </p>
        </div>

        <!-- Row 2: subtitle + menu -->
        <div class="flex items-center justify-between mt-0.5">
          <p class="text-[12px] text-muted-foreground truncate">
            {{ [account.bank_name, ACCOUNT_TYPE_LABELS[account.type]].filter(Boolean).join(' · ') }}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 -mr-1"
              >
                <MoreHorizontal :size="13" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-36">
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
      </div>
    </div>
  </div>
</template>
