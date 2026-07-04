<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { X, Plus, Trash2, Loader2, CheckCircle2, Check, Pencil } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import { useShoppingItemStore } from '@/stores/shoppingItems'
import { useShoppingItems } from '@/features/purchases/composables/useShoppingItems'
import { useFrequentItems } from '@/features/purchases/composables/useFrequentItems'
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
const adding = ref(false)

// Inline edit state
const editingItemId = ref<string | null>(null)
const editName = ref('')
const editCategory = ref('')
const editPriceCents = ref('')
const saving = ref(false)

const { grouped } = useShoppingItems(() => props.session.items)

// Frequentes: chips de 1 toque, filtrados pelo que está sendo digitado
const { loadFrequent, suggestions } = useFrequentItems({
  query: newName,
  existingNames: () => props.session.items.map((i) => i.name),
})

async function addFrequent(name: string) {
  if (adding.value) return
  adding.value = true
  try {
    await itemStore.addItem(props.session.id, { name, category: null, price: null })
    newName.value = ''
  } catch {
    toast.error('Erro ao adicionar item')
  } finally {
    adding.value = false
  }
}

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

// Modo mercado: só rouba o foco (e sobe o teclado) quando a lista está VAZIA.
// Com itens, quem abre o sheet quer VER a lista, não digitar.
watch(open, (val) => {
  if (val) {
    loadFrequent()
    if (props.session.items_count === 0) {
      nextTick(() => nameInputRef.value?.focus())
    }
  }
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

// ── Actions ───────────────────────────────────────────────────────────────────
async function addItem() {
  const name = newName.value.trim()
  if (!name) return
  adding.value = true
  try {
    await itemStore.addItem(props.session.id, { name, category: null, price: null })
    newName.value = ''
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

// ── Inline edit ───────────────────────────────────────────────────────────────
function startEdit(item: ShoppingItem) {
  editingItemId.value = item.id
  editName.value = item.name
  editCategory.value = item.category ?? ''
  editPriceCents.value = item.price !== null ? Math.round(item.price * 100).toString() : ''
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
    const parsedPrice = editPriceCents.value ? parseInt(editPriceCents.value, 10) / 100 : null
    await itemStore.updateItem(item.id, {
      name,
      category: editCategory.value.trim() || null,
      price: parsedPrice,
    })
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

function handleEditFieldKeydown(e: KeyboardEvent, item: ShoppingItem) {
  if (e.key === 'Enter') saveEdit(item)
  if (e.key === 'Escape') cancelEdit()
}

function handleEditPriceInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  editPriceCents.value = digits
  ;(e.target as HTMLInputElement).value = formatPriceCents(digits)
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
      <div class="sticky top-0 bg-background z-20 border-b border-border">
        <div class="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-border shrink-0" />

        <div class="px-5 py-3 flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-[16px] font-bold truncate">{{ session.title }}</p>
            <p class="text-[12px] mt-0.5">
              <span v-if="allBought" class="text-primary font-semibold">✓ Tudo comprado!</span>
              <span v-else class="text-muted-foreground">
                {{ session.bought_count }} de {{ session.items_count }} itens
              </span>
            </p>
            <div class="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
              <div
                class="h-full rounded-full bg-primary transition-all duration-500"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>

          <button
            type="button"
            class="size-8 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0 mt-0.5"
            @click="open = false"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Add item form — input único: categoria/preço ficam no modo edição
             (dados de prod: 0 de 10 itens usaram esses campos no cadastro) -->
        <div class="px-5 pb-3 flex gap-2">
          <input
            ref="nameInputRef"
            v-model="newName"
            placeholder="Adicionar item... (Enter)"
            class="flex-1 h-12 px-4 rounded-xl bg-muted focus:border-primary outline-none text-[15px] transition-colors placeholder:text-muted-foreground"
            @keydown="handleNameKeydown"
          />
          <button
            type="button"
            class="size-12 rounded-xl bg-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
            :disabled="adding || !newName.trim()"
            @click="addItem"
          >
            <Loader2 v-if="adding" :size="16" class="animate-spin text-primary-foreground" />
            <Plus v-else :size="18" class="text-primary-foreground" />
          </button>
        </div>

        <!-- Frequentes — 1 toque adiciona; filtram conforme você digita -->
        <div v-if="suggestions.length > 0" class="px-5 pb-3 -mt-0.5 overflow-x-auto scrollbar-none">
          <div class="flex items-center gap-1.5 w-max">
            <button
              v-for="s in suggestions"
              :key="s.name"
              type="button"
              class="h-8 px-3 rounded-full text-[12px] font-medium whitespace-nowrap bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-40"
              :disabled="adding"
              @click="addFrequent(s.name)"
            >
              + {{ s.name }}
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
          <span class="size-12 rounded-xl bg-muted grid place-items-center mb-3">
            <CheckCircle2 :size="22" class="text-muted-foreground" />
          </span>
          <p class="text-[14px] font-medium text-muted-foreground">Lista vazia</p>
          <p class="text-[12px] text-muted-foreground mt-1">Adicione o primeiro item acima ↑</p>
        </div>

        <!-- Groups -->
        <template v-for="([category, group]) in grouped" :key="category">
          <div v-if="group.pending.length > 0 || group.bought.length > 0">
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 mt-4 border-l-2 pl-2">
              {{ category }}
            </p>

            <!-- Pending items -->
            <div
              v-for="item in group.pending"
              :key="item.id"
              class="group flex items-start gap-2 py-3 border-b border-border last:border-0 transition-colors"
            >
              <!-- Custom circular checkbox touch area -->
              <button
                type="button"
                class="flex items-center justify-center size-11 -ml-2 shrink-0 mt-0.5"
                @click="toggle(item.id, item.is_bought)"
              >
                <span class="size-6 rounded-full border-2 border-border bg-transparent transition-all duration-200" />
              </button>

              <!-- Name / edit area -->
              <div class="flex-1 min-w-0">
                <template v-if="editingItemId === item.id">
                  <div class="space-y-1.5" @click.stop>
                    <input
                      :id="`edit-name-${item.id}`"
                      v-model="editName"
                      class="w-full h-8 px-2 rounded-lg bg-background outline-none text-[13px] transition-colors"
                      @keydown="handleEditNameKeydown($event, item)"
                    />
                    <div class="flex gap-1.5">
                      <input
                        v-model="editCategory"
                        placeholder="Categoria"
                        class="flex-1 h-7 px-2 rounded-lg bg-muted text-[12px] outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                        @keydown="handleEditFieldKeydown($event, item)"
                      />
                      <input
                        inputmode="numeric"
                        placeholder="R$ 0,00"
                        class="w-24 h-7 px-2 rounded-lg bg-muted text-[12px] tabular-nums text-right outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                        :value="formatPriceCents(editPriceCents)"
                        @input="handleEditPriceInput"
                        @keydown="handleEditFieldKeydown($event, item)"
                      />
                    </div>
                  </div>
                </template>
                <span v-else class="block text-[14px] font-medium text-foreground truncate mt-1.5">{{ item.name }}</span>
              </div>

              <!-- Price (display mode only) -->
              <span
                v-if="item.price !== null && editingItemId !== item.id"
                class="text-[13px] tabular-nums text-muted-foreground shrink-0 mt-1.5"
              >
                {{ formatCurrency(item.price) }}
              </span>

              <!-- Action buttons: Pencil + Trash (hover, display mode) -->
              <div
                v-if="editingItemId !== item.id"
                class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
              >
                <button
                  type="button"
                  class="size-8 grid place-items-center text-muted-foreground hover:text-primary transition-colors"
                  @click="startEdit(item)"
                >
                  <Pencil :size="13" />
                </button>
                <button
                  type="button"
                  class="size-8 grid place-items-center text-muted-foreground hover:text-destructive transition-colors"
                  @click="removeItem(item.id)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>

              <!-- Save/Cancel (edit mode) -->
              <div v-else class="flex items-center gap-0.5 shrink-0 mt-0.5">
                <button
                  type="button"
                  class="size-8 grid place-items-center text-primary hover:brightness-110 rounded-lg transition-colors"
                  @click.stop="saveEdit(item)"
                >
                  <Check :size="13" />
                </button>
                <button
                  type="button"
                  class="size-8 grid place-items-center text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  @click.stop="cancelEdit()"
                >
                  <X :size="13" />
                </button>
              </div>
            </div>

            <!-- Bought items — check circle, no trash -->
            <div
              v-for="item in group.bought"
              :key="item.id"
              class="flex items-center gap-3 py-3.5 border-b border-border last:border-0 opacity-60 transition-all duration-300"
            >
              <button
                type="button"
                class="flex items-center justify-center size-11 -ml-2 shrink-0"
                @click="toggle(item.id, item.is_bought)"
              >
                <span class="size-6 rounded-full bg-primary border-2 border-primary flex items-center justify-center transition-all duration-200">
                  <Check :size="14" class="text-primary-foreground" :stroke-width="3" />
                </span>
              </button>
              <span class="flex-1 min-w-0 text-[14px] line-through text-muted-foreground truncate">
                {{ item.name }}
              </span>
              <span
                v-if="item.price !== null"
                class="text-[13px] tabular-nums text-muted-foreground shrink-0"
              >
                {{ formatCurrency(item.price) }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Sticky footer -->
      <div class="sticky bottom-0 z-20 bg-background backdrop-blur-sm border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div v-if="suggestedDisplay" class="mb-2 flex items-baseline justify-between">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground">TOTAL PARCIAL</p>
          <p class="text-[17px] font-bold tabular-nums text-foreground">{{ suggestedDisplay }}</p>
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
