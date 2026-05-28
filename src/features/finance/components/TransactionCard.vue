<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, ArrowLeftRight, Clock, Repeat } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
}>()

/** Category color or type fallback */
const sideColor = computed(() => {
  if (props.transaction.category?.color) return props.transaction.category.color
  if (props.transaction.type === 'income') return 'oklch(0.66 0.11 155)'
  if (props.transaction.type === 'expense') return 'oklch(0.62 0.16 22)'
  return 'oklch(0.5 0.008 270)'
})

const isPending = computed(() => props.transaction.status === 'pending')
</script>

<template>
  <!-- li wrapper carries the left accent via boxShadow (confirmed) or dashed (pending) -->
  <li
    class="relative"
    :style="isPending
      ? {
          backgroundImage: `linear-gradient(to bottom, ${sideColor}99 0 4px, transparent 4px 8px)`,
          backgroundSize: '3px 8px',
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'left top',
        }
      : { boxShadow: `inset 3px 0 0 0 ${sideColor}` }"
  >
    <button
      type="button"
      class="w-full flex items-center gap-3 pl-4 pr-4 py-3 min-h-[56px] lg:min-h-[48px] text-left hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer"
      :class="isPending ? 'opacity-65' : ''"
      @click="emit('select', transaction)"
    >
      <!-- Category icon swatch — 40px, dashed ring when pending -->
      <div :class="isPending ? 'ring-1 ring-dashed ring-muted-foreground/50 rounded-xl p-0.5 saturate-50 shrink-0' : 'shrink-0'">
        <span
          v-if="transaction.type !== 'transfer'"
          class="rounded-xl grid place-items-center size-10"
          :style="{
            background: (transaction.category?.color ?? sideColor) + '22',
            color: transaction.category?.color ?? sideColor,
          }"
        >
          <component
            v-if="transaction.category?.icon && findIcon(transaction.category.icon)"
            :is="findIcon(transaction.category.icon)!.component"
            :size="22"
            :stroke-width="1.9"
          />
          <span v-else class="text-sm font-bold">
            {{ transaction.description.charAt(0).toUpperCase() }}
          </span>
        </span>
        <span
          v-else
          class="rounded-xl grid place-items-center size-10 text-muted-foreground"
          style="background: hsl(var(--muted) / 0.6)"
        >
          <ArrowLeftRight :size="18" :stroke-width="1.9" />
        </span>
      </div>

      <!-- Description + subtitle -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <!-- Clock icon inline for pending -->
          <Clock v-if="isPending" :size="10" class="text-warning shrink-0" aria-label="Pendente" />
          <p class="text-[14px] lg:text-sm truncate font-medium">{{ transaction.description }}</p>
          <Repeat
            v-if="transaction.is_recurring"
            :size="13"
            class="text-muted-foreground shrink-0"
            aria-label="Recorrente"
          />
        </div>
        <p class="subtle-meta truncate flex items-center gap-1.5">
          <span class="truncate">
            <template v-if="transaction.category">{{ transaction.category.name }}</template>
            <template v-if="transaction.account">
              {{ transaction.category ? ' · ' : '' }}{{ transaction.account.name }}
            </template>
            <template v-else-if="transaction.card">
              {{ transaction.category ? ' · ' : '' }}{{ transaction.card.name }}
            </template>
          </span>
          <!-- Pendente badge inline in subtitle -->
          <span
            v-if="isPending"
            class="inline-flex items-center h-4 px-1.5 rounded text-[9.5px] font-semibold border shrink-0"
            style="background: color-mix(in oklab, oklch(0.76 0.12 80) 10%, transparent); color: oklch(0.76 0.12 80); border-color: color-mix(in oklab, oklch(0.76 0.12 80) 30%, transparent)"
          >
            Pendente
          </span>
        </p>
      </div>

      <!-- Amount -->
      <span
        class="inline-flex items-center gap-0.5 text-sm tabular-nums font-semibold shrink-0"
        :class="transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'"
      >
        <ArrowUp v-if="transaction.type === 'income'" :size="12" />
        <ArrowDown v-else-if="transaction.type === 'expense'" :size="12" />
        {{ formatCurrency(transaction.amount) }}
      </span>
    </button>
  </li>
</template>
