<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { CheckCircle2, Link, Circle, Pencil, Check, X } from 'lucide-vue-next'
import { Sheet, SheetContent } from '@ui/sheet'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@ui/alert-dialog'
import { formatCurrency } from '@/utils/currency'
import { useShoppingItems } from '@/features/purchases/composables/useShoppingItems'
import { useShoppingItemStore } from '@/stores/shoppingItems'
import { useShoppingSessionStore } from '@/stores/shoppingSessions'
import { useToast } from '@/composables/useToast'
import type { ShoppingSession, ShoppingItem } from '@/types/shopping'

const props = defineProps<{
  session: ShoppingSession
}>()

const emit = defineEmits<{
  reopened: []
}>()

const open = defineModel<boolean>('open', { default: false })

const itemStore = useShoppingItemStore()
const sessionStore = useShoppingSessionStore()
const toast = useToast()

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

// ── Inline item edit ──────────────────────────────────────────────────────────
const editingItemId = ref<string | null>(null)
const editName = ref('')
const editCategory = ref('')
const editPriceCents = ref('')
const saving = ref(false)

function formatPriceCents(digits: string): string {
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleEditPriceInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  editPriceCents.value = digits
  ;(e.target as HTMLInputElement).value = formatPriceCents(digits)
}

function startEdit(item: ShoppingItem) {
  editingItemId.value = item.id
  editName.value = item.name
  editCategory.value = item.category ?? ''
  editPriceCents.value = item.price !== null ? Math.round(item.price * 100).toString() : ''
  nextTick(() => {
    const el = document.getElementById(`detail-edit-name-${item.id}`)
    el?.focus()
  })
}

async function saveEdit(item: ShoppingItem) {
  if (!editingItemId.value || editingItemId.value !== item.id) return
  const name = editName.value.trim()
  if (!name) { cancelEdit(); return }
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

function handleEditKeydown(e: KeyboardEvent, item: ShoppingItem) {
  if (e.key === 'Enter') saveEdit(item)
  if (e.key === 'Escape') cancelEdit()
}

// ── Reopen ────────────────────────────────────────────────────────────────────
const reopenDialogOpen = ref(false)

async function confirmReopen() {
  reopenDialogOpen.value = false
  try {
    await sessionStore.reopenSession(props.session.id)
    toast.success('Lista reaberta!')
    emit('reopened')
  } catch {
    toast.error('Erro ao reabrir lista')
  }
}
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

            <!-- Bought items first -->
            <div
              v-for="item in group.bought"
              :key="item.id"
              class="group/item flex items-start gap-2 py-3 border-b border-border/30 last:border-0"
            >
              <CheckCircle2 :size="16" class="text-primary shrink-0 mt-0.5" />

              <div class="flex-1 min-w-0">
                <template v-if="editingItemId === item.id">
                  <div class="space-y-1.5" @click.stop>
                    <input
                      :id="`detail-edit-name-${item.id}`"
                      v-model="editName"
                      class="w-full h-8 px-2 rounded-lg bg-background border border-primary/60 outline-none text-[13px] transition-colors"
                      @keydown="handleEditKeydown($event, item)"
                    />
                    <div class="flex gap-1.5">
                      <input
                        v-model="editCategory"
                        placeholder="Categoria"
                        class="flex-1 h-7 px-2 rounded-lg bg-muted/40 border border-border text-[12px] outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
                        @keydown="handleEditKeydown($event, item)"
                      />
                      <input
                        inputmode="numeric"
                        placeholder="R$ 0,00"
                        class="w-24 h-7 px-2 rounded-lg bg-muted/40 border border-border text-[12px] tabular-nums text-right outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
                        :value="formatPriceCents(editPriceCents)"
                        @input="handleEditPriceInput"
                        @keydown="handleEditKeydown($event, item)"
                      />
                    </div>
                  </div>
                </template>
                <span v-else class="block text-[13px] text-muted-foreground line-through truncate mt-0.5">{{ item.name }}</span>
              </div>

              <span
                v-if="item.price !== null && editingItemId !== item.id"
                class="text-[12px] tabular-nums text-muted-foreground shrink-0 mt-0.5"
              >
                {{ formatCurrency(item.price) }}
              </span>

              <div v-if="editingItemId !== item.id" class="opacity-0 group-hover/item:opacity-100 shrink-0 mt-0.5">
                <button type="button"
                  class="size-7 grid place-items-center text-muted-foreground/30 hover:text-primary transition-colors rounded-lg"
                  @click="startEdit(item)">
                  <Pencil :size="12" />
                </button>
              </div>
              <div v-else class="flex items-center gap-0.5 shrink-0 mt-0.5">
                <button type="button"
                  class="size-7 grid place-items-center text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  @click.stop="saveEdit(item)">
                  <Check :size="12" />
                </button>
                <button type="button"
                  class="size-7 grid place-items-center text-muted-foreground/40 hover:bg-muted/30 rounded-lg transition-colors"
                  @click.stop="cancelEdit()">
                  <X :size="12" />
                </button>
              </div>
            </div>

            <!-- Not-bought items (missed / skipped) -->
            <div
              v-for="item in group.pending"
              :key="item.id"
              class="group/item flex items-start gap-2 py-3 border-b border-border/30 last:border-0"
            >
              <Circle :size="16" class="text-muted-foreground/40 shrink-0 mt-0.5" />

              <div class="flex-1 min-w-0">
                <template v-if="editingItemId === item.id">
                  <div class="space-y-1.5" @click.stop>
                    <input
                      :id="`detail-edit-name-${item.id}`"
                      v-model="editName"
                      class="w-full h-8 px-2 rounded-lg bg-background border border-primary/60 outline-none text-[13px] transition-colors"
                      @keydown="handleEditKeydown($event, item)"
                    />
                    <div class="flex gap-1.5">
                      <input
                        v-model="editCategory"
                        placeholder="Categoria"
                        class="flex-1 h-7 px-2 rounded-lg bg-muted/40 border border-border text-[12px] outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
                        @keydown="handleEditKeydown($event, item)"
                      />
                      <input
                        inputmode="numeric"
                        placeholder="R$ 0,00"
                        class="w-24 h-7 px-2 rounded-lg bg-muted/40 border border-border text-[12px] tabular-nums text-right outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/40"
                        :value="formatPriceCents(editPriceCents)"
                        @input="handleEditPriceInput"
                        @keydown="handleEditKeydown($event, item)"
                      />
                    </div>
                  </div>
                </template>
                <span v-else class="block text-[13px] text-muted-foreground/60 truncate mt-0.5">{{ item.name }}</span>
              </div>

              <span
                v-if="item.price !== null && editingItemId !== item.id"
                class="text-[12px] tabular-nums text-muted-foreground/50 shrink-0 mt-0.5"
              >
                {{ formatCurrency(item.price) }}
              </span>

              <div v-if="editingItemId !== item.id" class="opacity-0 group-hover/item:opacity-100 shrink-0 mt-0.5">
                <button type="button"
                  class="size-7 grid place-items-center text-muted-foreground/30 hover:text-primary transition-colors rounded-lg"
                  @click="startEdit(item)">
                  <Pencil :size="12" />
                </button>
              </div>
              <div v-else class="flex items-center gap-0.5 shrink-0 mt-0.5">
                <button type="button"
                  class="size-7 grid place-items-center text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  @click.stop="saveEdit(item)">
                  <Check :size="12" />
                </button>
                <button type="button"
                  class="size-7 grid place-items-center text-muted-foreground/40 hover:bg-muted/30 rounded-lg transition-colors"
                  @click.stop="cancelEdit()">
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border/30 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          class="w-full h-[52px] rounded-xl font-semibold text-[15px] bg-muted/30 text-foreground/80 flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          @click="reopenDialogOpen = true"
        >
          Reabrir lista
        </button>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Reopen confirmation -->
  <AlertDialog v-model:open="reopenDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Reabrir lista?</AlertDialogTitle>
        <AlertDialogDescription>
          A lista <strong>"{{ session.title }}"</strong> será reaberta como ativa. O vínculo com a transação será removido.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction @click="confirmReopen">
          Reabrir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
