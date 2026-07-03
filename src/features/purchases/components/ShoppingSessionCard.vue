<script setup lang="ts">
import { computed } from 'vue'
import {
  ShoppingCart,
  Link,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  Trash2,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { formatCurrency } from '@/utils/currency'
import type { ShoppingSession } from '@/types/shopping'

const props = defineProps<{
  session: ShoppingSession
}>()

const emit = defineEmits<{
  open: []
  reopen: []
  delete: []
}>()

const finishedDate = computed(() => {
  if (!props.session.finished_at) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(props.session.finished_at))
})
</script>

<template>
  <div
    class="group bg-card rounded-xl overflow-hidden flex cursor-pointer hover:border-border transition-colors"
    @click="emit('open')"
  >
    <!-- Left accent bar -->
    <div class="w-[2px] bg-muted shrink-0" />

    <!-- Content -->
    <div class="flex-1 p-4 min-w-0">
      <!-- Top row: icon + info + ⋮ menu -->
      <div class="flex items-center gap-3">
        <span class="size-9 rounded-xl bg-muted text-primary grid place-items-center shrink-0">
          <ShoppingCart :size="16" />
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-[14px] font-semibold text-foreground truncate">{{ session.title }}</p>
            <span
              v-if="session.transaction_id"
              class="shrink-0 flex items-center gap-1 text-[10px] font-medium text-primary bg-muted rounded-full px-2 py-0.5"
            >
              <Link :size="10" />
              vinculada
            </span>
          </div>
          <p class="text-[12px] text-muted-foreground mt-0.5">{{ finishedDate }}</p>
        </div>

        <!-- ⋮ menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100 shrink-0"
              @click.stop
            >
              <MoreVertical :size="15" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" @click.stop>
            <DropdownMenuItem @click.stop="emit('open')">
              <ExternalLink :size="14" class="mr-2" />
              Abrir detalhes
            </DropdownMenuItem>
            <DropdownMenuItem @click.stop="emit('reopen')">
              <RefreshCw :size="14" class="mr-2" />
              Reabrir lista
            </DropdownMenuItem>
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click.stop="emit('delete')"
            >
              <Trash2 :size="14" class="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Bottom row: value + items count -->
      <div class="flex items-baseline justify-between mt-3">
        <span
          v-if="session.total !== null"
          class="text-[15px] font-bold tabular-nums text-foreground"
        >
          {{ formatCurrency(session.total) }}
        </span>
        <span v-else class="text-[15px] font-bold text-muted-foreground">—</span>
        <span class="text-[12px] text-muted-foreground">
          {{ session.items_count }} item{{ session.items_count !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  </div>
</template>
