<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Link, Circle } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { formatCurrency } from '@/utils/currency'
import { useShoppingItems } from '@/features/purchases/composables/useShoppingItems'
import type { ShoppingSession } from '@/types/shopping'

const props = defineProps<{
  session: ShoppingSession
}>()

const open = defineModel<boolean>('open', { default: false })

const { grouped } = useShoppingItems(() => props.session.items)

const finishedDate = computed(() => {
  if (!props.session.finished_at) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(props.session.finished_at))
})

const boughtCount = computed(() => props.session.items.filter((i) => i.is_bought).length)
const totalCount = computed(() => props.session.items.length)
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[88vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Hero -->
      <div class="px-5 pt-4 pb-5 border-b border-border/30">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-[16px] font-bold text-foreground truncate">{{ session.title }}</p>
            <p class="text-[12px] text-muted-foreground/60 mt-0.5">{{ finishedDate }}</p>
          </div>
          <span
            v-if="session.transaction_id"
            class="shrink-0 flex items-center gap-1 text-[10px] text-primary bg-primary/10 rounded-full px-2.5 py-1 font-medium"
          >
            <Link :size="9" />
            vinculada
          </span>
        </div>

        <!-- Total + count -->
        <div class="flex items-end justify-between mt-4">
          <div>
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">
              TOTAL GASTO
            </p>
            <p
              v-if="session.total !== null"
              class="text-[30px] font-bold tabular-nums text-foreground leading-none"
            >
              {{ formatCurrency(session.total) }}
            </p>
            <p v-else class="text-[20px] font-semibold text-muted-foreground/40">—</p>
          </div>
          <div class="text-right">
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">
              ITENS
            </p>
            <p class="text-[16px] font-semibold text-foreground">
              {{ boughtCount }}/{{ totalCount }}
              <span class="text-[12px] text-muted-foreground/60 font-normal">comprados</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <!-- Empty state -->
        <div
          v-if="session.items.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <span class="size-10 rounded-xl bg-muted/30 grid place-items-center mb-2">
            <CheckCircle2 :size="18" class="text-muted-foreground/40" />
          </span>
          <p class="text-[13px] text-muted-foreground/50">Nenhum item registrado</p>
        </div>

        <!-- Groups -->
        <template v-for="([category, group]) in grouped" :key="category">
          <div v-if="group.pending.length > 0 || group.bought.length > 0">
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-2 mt-4 border-l-2 border-primary/40 pl-2">
              {{ category }}
            </p>

            <!-- Bought items first in detail view — no card wrapper -->
            <div
              v-for="item in group.bought"
              :key="item.id"
              class="flex items-center gap-3 py-3 border-b border-border/30 last:border-0"
            >
              <CheckCircle2 :size="16" class="text-primary shrink-0" />
              <span class="flex-1 min-w-0 text-[13px] text-muted-foreground line-through truncate">{{ item.name }}</span>
              <span
                v-if="item.price !== null"
                class="text-[12px] tabular-nums text-muted-foreground shrink-0"
              >
                {{ formatCurrency(item.price) }}
              </span>
            </div>

            <!-- Not-bought items (missed / skipped) -->
            <div
              v-for="item in group.pending"
              :key="item.id"
              class="flex items-center gap-3 py-3 border-b border-border/30 last:border-0"
            >
              <Circle :size="16" class="text-muted-foreground/40 shrink-0" />
              <span class="flex-1 min-w-0 text-[13px] text-muted-foreground/60 truncate">{{ item.name }}</span>
              <span
                v-if="item.price !== null"
                class="text-[12px] tabular-nums text-muted-foreground/50 shrink-0"
              >
                {{ formatCurrency(item.price) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </SheetContent>
  </Sheet>
</template>
