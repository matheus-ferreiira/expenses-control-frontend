<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { X, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { Checkbox } from '@ui/checkbox'
import { useShoppingItemStore } from '@/stores/shoppingItems'
import { useShoppingItems } from '@/features/purchases/composables/useShoppingItems'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import type { ShoppingSession, ShoppingItem } from '@/types/shopping'

const props = defineProps<{
  session: ShoppingSession
}>()

const emit = defineEmits<{
  finish: []
}>()

const open = defineModel<boolean>('open', { default: false })

const itemStore = useShoppingItemStore()
const toast = useToast()

const nameInputRef = ref<HTMLInputElement | null>(null)
const newName = ref('')
const newCategory = ref('')
const priceCents = ref('')
const adding = ref(false)

// Inline edit state
const editingItemId = ref<string | null>(null)
const editName = ref('')
const saving = ref(false)

const { grouped } = useShoppingItems(() => props.session.items)

const allBought = computed(
  () => props.session.items_count > 0 && props.session.bought_count === props.session.items_count,
)

const progressPercent = computed(() => {
  if (!props.session.items_count) return 0
  return Math.round((props.session.bought_count / props.session.items_count) * 100)
})

const suggestedDisplay = computed(() => {
  if (props.session.suggested_total > 0) return formatCurrency(props.session.suggested_total)
  return null
})

// Auto-focus name input when sheet opens
watch(open, (val) => {
  if (val) nextTick(() => nameInputRef.value?.focus())
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
    // Return focus to name input for fast sequential entry
    await nextTick()
    nameInputRef.value?.focus()
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

function handleNameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') addItem()
}

function handleFieldKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') addItem()
}

// ── Inline edit ───────────────────────────────────────────────────────────────
function startEdit(item: ShoppingItem) {
  editingItemId.value = item.id
  editName.value = item.name
  nextTick(() => {
    const el = document.getElementById(`edit-name-${item.id}`)
    el?.focus()
  })
}

async function saveEdit(item: ShoppingItem) {
  if (!editingItemId.value || editingItemId.value !== item.id) return
  const name = editName.value.trim()
  if (!name) {
    cancelEdit()
    return
  }
  saving.value = true
  try {
    await itemStore.updateItem(item.id, { name })
  } catch {
    toast.error('Erro ao atualizar item')
  } finally {
    saving.value = false
    editingItemId.value = null
  }
}

function cancelEdit() {
  editingItemId.value = null
}

function handleEditNameKeydown(e: KeyboardEvent, item: ShoppingItem) {
  if (e.key === 'Enter') saveEdit(item)
  if (e.key === 'Escape') cancelEdit()
}

// ── Finish guard ──────────────────────────────────────────────────────────────
function handleFinish() {
  if (props.session.items_count === 0) {
    toast.error('Adicione pelo menos um item antes de finalizar')
    return
  }
  emit('finish')
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Header (sticky) -->
      <div class="sticky top-0 bg-background z-20 border-b border-border/30">
        <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

        <div class="px-5 py-3 flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-[15px] font-semibold truncate">{{ session.title }}</p>
            <p class="text-[12px] mt-0.5">
              <span v-if="allBought" class="text-primary font-semibold">✓ Tudo comprado!</span>
              <span v-else class="text-muted-foreground">
                {{ session.bought_count }} de {{ session.items_count }} itens
              </span>
            </p>
            <div class="h-1.5 rounded-full bg-muted/30 overflow-hidden mt-2">
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
            ref="nameInputRef"
            v-model="newName"
            placeholder="Nome do item — Enter para adicionar"
            class="w-full h-11 px-3 rounded-xl bg-card border border-border focus:border-primary/60 outline-none text-[13px] transition-colors placeholder:text-muted-foreground/50"
            @keydown="handleNameKeydown"
          />
          <div class="flex gap-2">
            <input
              v-model="newCategory"
              placeholder="Categoria (opcional)"
              class="flex-1 h-9 px-3 rounded-xl bg-card border border-border focus:border-primary/60 outline-none text-[12px] transition-colors placeholder:text-muted-foreground/50"
              @keydown="handleFieldKeydown"
            />
            <input
              inputmode="numeric"
              placeholder="0,00"
              class="w-28 h-9 px-3 rounded-xl bg-card border border-border focus:border-primary/60 outline-none text-[12px] tabular-nums transition-colors placeholder:text-muted-foreground/50"
              :value="formatPriceCents(priceCents)"
              @input="handlePriceInput"
              @keydown="handleFieldKeydown"
            />
            <button
              type="button"
              class="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center hover:bg-primary/25 transition-colors disabled:opacity-40 shrink-0"
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
      <div class="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-4">
        <!-- Empty state -->
        <div
          v-if="session.items.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <span class="size-12 rounded-xl bg-muted/30 grid place-items-center mb-3">
            <CheckCircle2 :size="22" class="text-muted-foreground/40" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground/60">Lista vazia</p>
          <p class="text-[12px] text-muted-foreground/40 mt-1">Adicione o primeiro item acima ↑</p>
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
                class="flex items-center gap-3 px-3 border-b border-border/40 last:border-0 min-h-[52px] transition-colors hover:bg-muted/20"
              >
                <!-- Full-width touch area for checkbox (44×44 minimum) -->
                <button
                  type="button"
                  class="flex items-center justify-center size-11 -ml-1 shrink-0"
                  @click="toggle(item.id, item.is_bought)"
                >
                  <Checkbox :checked="item.is_bought" class="pointer-events-none" />
                </button>

                <!-- Inline edit or display name -->
                <div class="flex-1 min-w-0 py-3" @click="startEdit(item)">
                  <template v-if="editingItemId === item.id">
                    <div @click.stop>
                      <input
                        :id="`edit-name-${item.id}`"
                        v-model="editName"
                        class="w-full h-8 px-2 rounded-lg bg-background border border-primary/60 outline-none text-[13px] transition-colors"
                        @keydown="handleEditNameKeydown($event, item)"
                        @blur="saveEdit(item)"
                      />
                    </div>
                  </template>
                  <span
                    v-else
                    class="block text-[14px] text-foreground truncate cursor-text"
                  >{{ item.name }}</span>
                </div>

                <span
                  v-if="item.price !== null && editingItemId !== item.id"
                  class="text-[13px] tabular-nums text-muted-foreground shrink-0"
                >
                  {{ formatCurrency(item.price) }}
                </span>
                <button
                  type="button"
                  class="size-8 grid place-items-center text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"
                  @click="removeItem(item.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>

              <!-- Bought items -->
              <div
                v-for="item in group.bought"
                :key="item.id"
                class="flex items-center gap-3 px-3 border-b border-border/40 last:border-0 min-h-[52px] transition-all duration-300 hover:bg-muted/20"
                :class="item.is_bought ? 'opacity-50' : ''"
              >
                <button
                  type="button"
                  class="flex items-center justify-center size-11 -ml-1 shrink-0"
                  @click="toggle(item.id, item.is_bought)"
                >
                  <Checkbox :checked="item.is_bought" class="pointer-events-none" />
                </button>
                <span class="flex-1 min-w-0 text-[14px] line-through text-muted-foreground/70 truncate py-3">
                  {{ item.name }}
                </span>
                <span
                  v-if="item.price !== null"
                  class="text-[13px] tabular-nums text-muted-foreground/50 shrink-0"
                >
                  {{ formatCurrency(item.price) }}
                </span>
                <button
                  type="button"
                  class="size-8 grid place-items-center text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"
                  @click="removeItem(item.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Sticky footer (BUG 6 — z-index acima do bottom nav) -->
      <div class="sticky bottom-0 z-20 bg-background border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div v-if="suggestedDisplay" class="mb-2 flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground/70 font-semibold">TOTAL PARCIAL</p>
          <p class="text-[16px] font-semibold tabular-nums text-foreground">{{ suggestedDisplay }}</p>
        </div>
        <button
          type="button"
          class="w-full h-[52px] rounded-xl font-semibold text-[15px] bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          :class="allBought ? 'animate-pulse' : ''"
          @click="handleFinish"
        >
          Finalizar compra
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
