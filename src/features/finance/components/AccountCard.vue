<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button'
import { MoreHorizontal, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-vue-next'
import type { BankAccount } from '@/types/finance'
import { ACCOUNT_TYPE_LABELS } from '@/types/finance'
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
    class="rounded-lg bg-card flex flex-col transition-opacity border"
    :class="!account.is_active ? 'opacity-50' : ''"
    style="border-color: rgba(255,255,255,0.07)"
  >
    <div class="p-4 flex flex-col gap-3 flex-1">

      <!-- Header: avatar + name + menu -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Avatar: 36px rounded-lg, 15% opacity background, color text -->
          <span
            class="rounded-lg grid place-items-center shrink-0 size-9 text-sm font-bold"
            :style="{
              background: account.is_active
                ? (account.color ?? '#6b7280') + '26'
                : 'rgba(255,255,255,0.08)',
              color: account.is_active
                ? (account.color ?? '#6b7280')
                : '#888888',
            }"
          >
            {{ account.name.substring(0, 2).toUpperCase() }}
          </span>

          <div class="min-w-0">
            <p class="text-[14px] font-medium text-foreground truncate leading-none">
              {{ account.name }}
            </p>
            <p class="text-[12px] text-muted-foreground mt-0.5">
              {{ account.bank_name || ACCOUNT_TYPE_LABELS[account.type] }}
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

      <!-- Balance -->
      <div class="flex items-center justify-between border-t pt-3" style="border-color: rgba(255,255,255,0.06)">
        <span class="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Saldo
        </span>
        <p
          class="text-[16px] font-semibold tabular-nums leading-none"
          :class="account.balance >= 0 ? 'text-success' : 'text-destructive'"
        >
          {{ formatCurrency(account.balance) }}
        </p>
      </div>
    </div>
  </div>
</template>
