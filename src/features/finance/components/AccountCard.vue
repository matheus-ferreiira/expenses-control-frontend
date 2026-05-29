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
    class="rounded-lg border border-border/60 bg-card overflow-hidden flex flex-col transition-opacity"
    :class="!account.is_active ? 'opacity-50' : ''"
  >
    <div class="p-3.5 flex flex-col gap-2.5 flex-1">
      <!-- Header: color dot + name + type label + menu -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Colored avatar with initials — primary identity color -->
          <span
            class="rounded-lg grid place-items-center shrink-0 w-9 h-9 text-[11px] font-bold text-white"
            :style="{ background: account.is_active
              ? (account.color || 'hsl(var(--muted-foreground) / 0.4)')
              : 'hsl(var(--muted-foreground) / 0.3)' }"
          >
            {{ account.name.substring(0, 2).toUpperCase() }}
          </span>

          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <!-- 8px color dot for accent identity without the thick bar -->
              <span
                class="size-2 rounded-full shrink-0"
                :style="{ background: account.is_active
                  ? (account.color || 'hsl(var(--muted-foreground) / 0.5)')
                  : 'hsl(var(--muted-foreground) / 0.3)' }"
              />
              <p class="text-[13px] font-semibold text-foreground truncate">{{ account.name }}</p>
            </div>
            <!-- Type shown once, as discrete subtitle -->
            <p class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/40 mt-0.5 ml-3.5">
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
            <DropdownMenuItem
              v-if="account.is_active"
              @click="emit('archive', account)"
            >
              <Archive :size="12" class="mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem
              v-else
              @click="emit('unarchive', account)"
            >
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

      <!-- Balance — label removed (type already shown above) -->
      <div class="flex items-center justify-between pt-1.5 border-t border-border/30">
        <span class="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/30">
          Saldo
        </span>
        <p
          :class="[
            'text-[20px] font-semibold tabular-nums leading-none',
            account.balance >= 0 ? 'text-foreground' : 'text-destructive/80',
          ]"
        >
          {{ formatCurrency(account.balance) }}
        </p>
      </div>
    </div>
  </div>
</template>
