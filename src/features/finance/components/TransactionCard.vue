<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { ArrowLeftRight, Check, Copy, Trash2 } from 'lucide-vue-next'
import type { Transaction } from '@/types/finance'
import { formatCurrency } from '@/utils/currency'
import { findIcon } from '@/lib/icons'

const props = defineProps<{
  transaction: Transaction
  highlighted?: boolean
}>()

const emit = defineEmits<{
  select: [transaction: Transaction]
  confirm: [transaction: Transaction]
  quickDelete: [id: string]
  quickDuplicate: [transaction: Transaction]
}>()

const isPending = computed(() => props.transaction.status === 'pending')

const highlightBg = computed(() => {
  if (!props.highlighted) return ''
  if (props.transaction.type === 'income') return 'bg-success/[0.08]'
  if (props.transaction.type === 'expense') return 'bg-destructive/[0.08]'
  return 'bg-muted'
})

// ── Amount ─────────────────────────────────────────────────────────────────
const amountClass = computed(() => {
  if (props.transaction.amount === 0) return 'text-muted-foreground'
  if (props.transaction.type === 'income') return 'text-success'
  if (props.transaction.type === 'expense') return 'text-destructive'
  return 'text-muted-foreground'
})

const amountPrefix = computed(() => {
  if (props.transaction.amount === 0 || props.transaction.type === 'transfer') return ''
  return props.transaction.type === 'income' ? '+' : '-'
})

// ── Subtitle ───────────────────────────────────────────────────────────────
const subtitle = computed(() => {
  const t = props.transaction
  // Transferência para conta OU para cartão (pagamento de fatura)
  if (t.type === 'transfer') return `→ ${t.destination_account?.name ?? t.card?.name ?? '?'}`
  const parts: string[] = []
  if (t.is_recurring) parts.push('↻ Fixa')
  if (t.category) parts.push(t.category.name)
  const account = t.account?.name ?? t.card?.name
  if (account) parts.push(account)
  return parts.join(' · ')
})

// ── Long press ─────────────────────────────────────────────────────────────
const liRef = ref<HTMLElement | null>(null)
const longPressActive = ref(false)
let pressTimer: ReturnType<typeof setTimeout> | null = null
let outsideClickHandler: ((e: Event) => void) | null = null
let wasLongPress = false

function startPress() {
  if (pressTimer || longPressActive.value) return
  pressTimer = setTimeout(() => {
    pressTimer = null
    longPressActive.value = true
    wasLongPress = true
    requestAnimationFrame(() => {
      outsideClickHandler = (e: Event) => {
        if (!liRef.value?.contains(e.target as Node)) {
          closeLongPress()
        }
      }
      document.addEventListener('click', outsideClickHandler, true)
    })
  }, 500)
}

function cancelPress() {
  if (pressTimer !== null) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function closeLongPress() {
  longPressActive.value = false
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler, true)
    outsideClickHandler = null
  }
}

function handleClick() {
  if (wasLongPress) { wasLongPress = false; return }
  if (longPressActive.value) return
  emit('select', props.transaction)
}

function handleQuickConfirm() {
  closeLongPress()
  emit('confirm', props.transaction)
}

function handleQuickDelete() {
  closeLongPress()
  emit('quickDelete', props.transaction.id)
}

function handleQuickDuplicate() {
  closeLongPress()
  emit('quickDuplicate', props.transaction)
}

onUnmounted(() => {
  if (pressTimer !== null) clearTimeout(pressTimer)
  if (outsideClickHandler) document.removeEventListener('click', outsideClickHandler, true)
})
</script>

<template>
  <li :id="`tx-${transaction.id}`" ref="liRef" class="relative">

    <!-- ── Long press action row ──────────────────────────────────────────── -->
    <div
      v-if="longPressActive"
      class="flex items-center gap-2 px-4 py-2.5 animate-in fade-in duration-150 transition-all"
    >
      <button
        v-if="isPending"
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-medium bg-muted text-success "
        @click.stop="handleQuickConfirm"
      >
        <Check :size="13" />
        Confirmar
      </button>
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-medium bg-muted text-muted-foreground "
        @click.stop="handleQuickDuplicate"
      >
        <Copy :size="13" />
        Duplicar
      </button>
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-medium bg-muted text-destructive "
        @click.stop="handleQuickDelete"
      >
        <Trash2 :size="13" />
        Excluir
      </button>
    </div>

    <!-- ── Normal row ─────────────────────────────────────────────────────── -->
    <button
      v-else
      type="button"
      class="w-full flex items-center gap-3 py-3 px-4 text-left transition-colors duration-150 cursor-pointer select-none"
      :class="[highlightBg]"
      @mousedown="startPress"
      @mouseup="cancelPress"
      @touchstart.passive="startPress"
      @touchend="cancelPress"
      @touchmove.passive="cancelPress"
      @click="handleClick"
    >
      <!-- Avatar -->
      <span
        v-if="transaction.type !== 'transfer'"
        class="rounded-xl flex items-center justify-center w-10 h-10 shrink-0"
        :style="transaction.category?.color ? {
          background: transaction.category.color + '26',
          color: transaction.category.color,
        } : {
          background: 'rgba(255,255,255,0.08)',
          color: 'hsl(var(--muted-foreground))',
        }"
      >
        <component
          v-if="transaction.category?.icon && findIcon(transaction.category.icon)"
          :is="findIcon(transaction.category.icon)!.component"
          :size="18"
          :stroke-width="1.9"
          aria-hidden="true"
        />
        <span v-else class="text-[13px] font-semibold">
          {{ transaction.description.charAt(0).toUpperCase() }}
        </span>
      </span>
      <span
        v-else
        class="rounded-xl flex items-center justify-center w-10 h-10 shrink-0 text-muted-foreground"
        style="background: rgba(255,255,255,0.08)"
      >
        <ArrowLeftRight :size="16" :stroke-width="1.9" aria-hidden="true" />
      </span>

      <!-- Description + subtitle -->
      <div class="flex-1 min-w-0">
        <!-- Title row -->
        <div class="flex items-center gap-1.5">
          <!-- Amber dot — pending indicator -->
          <span v-if="isPending" class="w-2 h-2 rounded-full bg-warning shrink-0" />
          <p class="text-[14px] font-medium text-foreground leading-tight truncate">
            {{ transaction.description }}
          </p>
          <!-- Installment badge -->
          <span
            v-if="transaction.installment_number && transaction.total_installments"
            class="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-semibold text-muted-foreground shrink-0 bg-muted"
          >
            {{ transaction.installment_number }}/{{ transaction.total_installments }}
          </span>
        </div>
        <!-- Subtitle: ↻ Fixa · category · account (or → destination for transfers) -->
        <p v-if="subtitle" class="text-[12px] text-muted-foreground truncate mt-0.5">
          {{ subtitle }}
        </p>
      </div>

      <!-- Amount -->
      <span
        class="text-[14px] tabular-nums font-semibold shrink-0"
        :class="amountClass"
      >
        {{ amountPrefix }}{{ formatCurrency(transaction.amount) }}
      </span>
    </button>

  </li>
</template>
