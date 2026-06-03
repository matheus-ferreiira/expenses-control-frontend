<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { Checkbox } from '@ui/checkbox'
import { useShoppingItemStore } from '@/stores/shoppingItems'
import { useShoppingItems } from '@/features/purchases/composables/useShoppingItems'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import type { ShoppingSession } from '@/types/shopping'

const props = defineProps<{
  session: ShoppingSession
}>()

const emit = defineEmits<{
  finish: []
}>()

const open = defineModel<boolean>('open', { default: false })

const itemStore = useShoppingItemStore()
const toast = useToast()

const newName = ref('')
const newCategory = ref('')
const priceCents = ref('')
const adding = ref(false)

const { grouped } = useShoppingItems(() => props.session.items)

const progressPercent = computed(() => {
  if (!props.session.items_count) return 0
  return Math.round((props.session.bought_count / props.session.items_count) * 100)
})

const suggestedDisplay = computed(() => {
  if (props.session.suggested_total > 0) return formatCurrency(props.session.suggested_total)
  return null
})

// ── Price mask ────────────────────────────────────────────────────────────────
function formatPriceCents(digits: string): string {
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function handlePriceInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  priceCents.value = digits
  ;(e.target as HTMLInputElement).value = formatPriceCents(digits)
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function addItem() {
  const name = newName.value.trim()
  if (!name) return
  adding.value = true
  try {
    const parsedPrice = priceCents.value ? parseInt(priceCents.value, 10) / 100 : null
    await itemStore.addItem(props.session.id, {
      name,
      category: newCategory.value.trim() || null,
      price: parsedPrice,
    })
    newName.value = ''
    newCategory.value = ''
    priceCents.value = ''
  } catch {
    toast.error('Erro ao adicionar item')
  } finally {
    adding.value = false
  }
}

async function toggle(itemId: string, current: boolean) {
  try {
    await itemStore.toggleBought(itemId, current)
  } catch {
    toast.error('Erro ao atualizar item')
  }
}

async function removeItem(itemId: string) {
  try {
    await itemStore.removeItem(itemId, props.session.id)
  } catch {
    toast.error('Erro ao remover item')
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') addItem()
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Header -->
      <div class="sticky top-0 bg-background z-10 border-b border-border/30">
        <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

        <div class="px-5 py-3 flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-[15px] font-semibold truncate">{{ session.title }}</p>
            <p class="text-[12px] text-muted-foreground mt-0.5">
              {{ session.bought_count }} de {{ session.items_count }} itens
            </p>
            <div class="h-1 rounded-full bg-muted overflow-hidden mt-2">
              <div
                class="h-full rounded-full bg-primary transition-all duration-500"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>

          <button
            type="button"
            class="size-8 grid place-items-center rounded-lg hover:bg-muted/40 text-muted-foreground transition-colors shrink-0 mt-0.5"
            @click="open = false"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Add item form -->
        <div class="px-5 pb-3 space-y-2">
          <input
            v-model="newName"
            placeholder="Nome do item — pressione Enter para adicionar"
            class="w-full h-11 px-3 rounded-xl bg-card border border-border focus:border-primary/60 outline-none text-[13px] transition-colors"
            @keydown="handleKeydown"
          />
          <div class="flex gap-2">
            <input
              v-model="newCategory"
              placeholder="Categoria (opcional)"
              class="flex-1 h-9 px-3 rounded-xl bg-card border border-border focus:border-primary/60 outline-none text-[12px] transition-colors"
              @keydown="handleKeydown"
            />
            <input
              inputmode="numeric"
              placeholder="0,00"
              class="w-28 h-9 px-3 rounded-xl bg-card border border-border focus:border-primary/60 outline-none text-[12px] tabular-nums transition-colors"
              :value="formatPriceCents(priceCents)"
              @input="handlePriceInput"
              @keydown="handleKeydown"
            />
            <button
              type="button"
              class="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center hover:bg-primary/25 transition-colors disabled:opacity-40"
              :disabled="adding || !newName.trim()"
              @click="addItem"
            >
              <Loader2 v-if="adding" :size="14" class="animate-spin" />
              <Plus v-else :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Item list -->
      <div class="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-36">
        <!-- Empty state -->
        <div
          v-if="session.items.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <span class="size-12 rounded-xl bg-muted/30 grid place-items-center mb-3">
            <CheckCircle2 :size="22" class="text-muted-foreground/40" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground/60">Lista vazia</p>
          <p class="text-[12px] text-muted-foreground/40 mt-1">Adicione itens acima para começar</p>
        </div>

        <!-- Groups -->
        <template v-for="([category, group]) in grouped" :key="category">
          <div v-if="group.pending.length > 0 || group.bought.length > 0">
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-1.5 px-1">
              {{ category }}
            </p>

            <div class="bg-card border border-border rounded-xl overflow-hidden">
              <!-- Pending items -->
              <div
                v-for="item in group.pending"
                :key="item.id"
                class="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 min-h-[52px] transition-colors hover:bg-muted/20"
              >
                <Checkbox
                  :checked="item.is_bought"
                  class="shrink-0"
                  @update:checked="toggle(item.id, item.is_bought)"
                />
                <span class="flex-1 min-w-0 text-[14px] text-foreground truncate">{{ item.name }}</span>
                <span
                  v-if="item.price !== null"
                  class="text-[13px] tabular-nums text-muted-foreground shrink-0"
                >
                  {{ formatCurrency(item.price) }}
                </span>
                <button
                  type="button"
                  class="size-7 grid place-items-center text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                  @click="removeItem(item.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>

              <!-- Bought items -->
              <div
                v-for="item in group.bought"
                :key="item.id"
                class="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 min-h-[52px] opacity-50 transition-colors hover:bg-muted/20"
              >
                <Checkbox
                  :checked="item.is_bought"
                  class="shrink-0"
                  @update:checked="toggle(item.id, item.is_bought)"
                />
                <span class="flex-1 min-w-0 text-[14px] line-through text-muted-foreground/70 truncate">{{ item.name }}</span>
                <span
                  v-if="item.price !== null"
                  class="text-[13px] tabular-nums text-muted-foreground/50 shrink-0"
                >
                  {{ formatCurrency(item.price) }}
                </span>
                <button
                  type="button"
                  class="size-7 grid place-items-center text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"
                  @click="removeItem(item.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Sticky footer -->
      <div class="sticky bottom-0 bg-background border-t border-border px-4 py-3">
        <div v-if="suggestedDisplay" class="mb-2">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/70">TOTAL PARCIAL</p>
          <p class="text-[16px] font-semibold tabular-nums text-foreground mt-0.5">{{ suggestedDisplay }}</p>
        </div>
        <button
          type="button"
          class="w-full h-[52px] rounded-xl font-semibold text-[15px] bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          @click="emit('finish')"
        >
          Finalizar compra
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
