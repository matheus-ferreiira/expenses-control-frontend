<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loader2, Check, CreditCard, Landmark, Receipt, X } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import { Sheet, SheetContent } from '@ui/sheet'
import { findIcon } from '@/lib/icons'
import { useShoppingSessionStore } from '@/stores/shoppingSessions'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import type { ShoppingSession } from '@/types/shopping'

const props = defineProps<{
  session: ShoppingSession
}>()

const emit = defineEmits<{
  finished: []
}>()

const open = defineModel<boolean>('open', { default: false })

const sessionStore = useShoppingSessionStore()
const financeStore = useFinanceStore()
const toast = useToast()

const totalCents = ref('')
const createTransaction = ref(true)
const selectedAccountId = ref<string | null>(null)
const selectedCardId = ref<string | null>(null)
const selectedCategoryId = ref<string | null>(null)
const submitting = ref(false)

// ── Total mask ────────────────────────────────────────────────────────────────
function formatTotalCents(digits: string): string {
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function handleTotalInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  totalCents.value = digits
  ;(e.target as HTMLInputElement).value = formatTotalCents(digits)
}

const parsedTotal = computed(() => {
  if (!totalCents.value) return 0
  return parseInt(totalCents.value, 10) / 100
})

const canSubmit = computed(() => parsedTotal.value > 0)

function applySuggestedTotal() {
  if (props.session.suggested_total > 0) {
    totalCents.value = Math.round(props.session.suggested_total * 100).toString()
  }
}

// ── Expense categories ────────────────────────────────────────────────────────
const expenseCategories = computed(() =>
  financeStore.categories.filter((c) => c.type === 'expense'),
)

function tryAutoSelectCategory() {
  const def = expenseCategories.value.find((c) => /alimenta|mercado/i.test(c.name))
  if (def) selectedCategoryId.value = def.id
}

watch(expenseCategories, (cats) => {
  if (selectedCategoryId.value === null && cats.length) tryAutoSelectCategory()
})

watch(open, (val) => {
  if (val) {
    totalCents.value = props.session.suggested_total > 0
      ? Math.round(props.session.suggested_total * 100).toString()
      : ''
    createTransaction.value = true
    selectedAccountId.value = null
    selectedCardId.value = null
    selectedCategoryId.value = null

    if (!financeStore.accounts.length) financeStore.fetchAccounts()
    if (!financeStore.cards.length) financeStore.fetchCards()
    if (!financeStore.categories.length) financeStore.fetchCategories()

    if (expenseCategories.value.length) tryAutoSelectCategory()
  }
})

// ── Account / card selectors ──────────────────────────────────────────────────
function selectAccount(id: string) {
  selectedAccountId.value = selectedAccountId.value === id ? null : id
  if (selectedAccountId.value) selectedCardId.value = null
}

function selectCard(id: string) {
  selectedCardId.value = selectedCardId.value === id ? null : id
  if (selectedCardId.value) selectedAccountId.value = null
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await sessionStore.finishSession(props.session.id, {
      total: parsedTotal.value,
      bank_account_id: createTransaction.value ? selectedAccountId.value : null,
      credit_card_id: createTransaction.value ? selectedCardId.value : null,
      category_id: createTransaction.value ? selectedCategoryId.value : null,
    })
    toast.success('Compra finalizada!')
    open.value = false
    emit('finished')
  } catch {
    toast.error('Erro ao finalizar compra')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[90vh] overflow-y-auto [&>button]:hidden"
    >
      <div class="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <div class="px-5 pb-2">
        <p class="text-[17px] font-semibold">Finalizar compra</p>
        <p class="text-[13px] text-muted-foreground mt-0.5">{{ session.title }}</p>
      </div>

      <div class="px-5 py-4 space-y-5">
        <!-- Total -->
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5">
            TOTAL GASTO (R$)
          </p>
          <input
            inputmode="numeric"
            placeholder="0,00"
            class="w-full h-14 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary/60 outline-none text-[24px] font-bold tabular-nums text-center transition-colors"
            :value="formatTotalCents(totalCents)"
            @input="handleTotalInput"
          />
          <button
            v-if="session.suggested_total > 0"
            type="button"
            class="text-[12px] text-muted-foreground/60 hover:text-primary transition-colors mt-1.5 block w-full text-center"
            @click="applySuggestedTotal"
          >
            Soma dos itens com preço: {{ formatCurrency(session.suggested_total) }} — toque para usar
          </button>
        </div>

        <!-- Toggle criar transação -->
        <div class="flex items-center gap-3 py-1">
          <span
            class="size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            :class="createTransaction ? 'bg-primary/10' : 'bg-muted'"
          >
            <Receipt
              :size="16"
              :class="createTransaction ? 'text-primary' : 'text-muted-foreground'"
            />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-foreground">Criar transação</p>
            <p class="text-[11px] text-muted-foreground/60">Registrar como despesa no Finance</p>
          </div>
          <button
            type="button"
            class="h-6 w-11 rounded-full transition-colors flex items-center px-0.5 shrink-0"
            :class="createTransaction ? 'bg-primary' : 'bg-muted'"
            @click="createTransaction = !createTransaction"
          >
            <span
              class="size-5 rounded-full bg-background shadow-sm transition-transform duration-200"
              :class="createTransaction ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Seletores (apenas quando toggle ativo) -->
        <div v-if="createTransaction" class="space-y-4">
          <!-- Contas -->
          <div v-if="financeStore.activeAccounts.length > 0">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
              CONTA
            </p>
            <div class="space-y-1.5">
              <button
                v-for="account in financeStore.activeAccounts"
                :key="account.id"
                type="button"
                class="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left border"
                :class="selectedAccountId === account.id ? 'border-primary bg-primary/10' : 'border-border/40 bg-muted/20 hover:bg-muted/35'"
                @click="selectAccount(account.id)"
              >
                <span
                  class="size-9 rounded-xl grid place-items-center shrink-0 transition-colors"
                  :class="selectedAccountId === account.id ? 'bg-primary/20 text-primary' : ''"
                  :style="selectedAccountId !== account.id ? { backgroundColor: (account.color ?? '#888') + '25', color: account.color ?? 'hsl(var(--muted-foreground))' } : {}"
                >
                  <Landmark :size="14" />
                </span>
                <span class="flex-1 min-w-0">
                  <span class="block text-[13px] font-medium truncate">{{ account.name }}</span>
                  <span class="block text-[11px] text-muted-foreground/60">{{ account.bank_name }}</span>
                </span>
              </button>
            </div>
          </div>

          <!-- Cartões -->
          <div v-if="financeStore.activeCards.length > 0">
            <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
              CARTÃO DE CRÉDITO
            </p>
            <div class="space-y-1.5">
              <button
                v-for="card in financeStore.activeCards"
                :key="card.id"
                type="button"
                class="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left border"
                :class="selectedCardId === card.id ? 'border-primary bg-primary/10' : 'border-border/40 bg-muted/20 hover:bg-muted/35'"
                @click="selectCard(card.id)"
              >
                <span
                  class="size-9 rounded-xl grid place-items-center shrink-0 transition-colors"
                  :class="selectedCardId === card.id ? 'bg-primary/20 text-primary' : ''"
                  :style="selectedCardId !== card.id ? { backgroundColor: (card.color ?? '#888') + '25', color: card.color ?? 'hsl(var(--muted-foreground))' } : {}"
                >
                  <CreditCard :size="14" />
                </span>
                <span class="text-[13px] font-medium truncate">{{ card.name }}</span>
              </button>
            </div>
          </div>

          <!-- Categoria — grid de ícones (padrão Finance) -->
          <div v-if="expenseCategories.length > 0">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                CATEGORIA
              </p>
              <button
                v-if="selectedCategoryId"
                type="button"
                class="text-[11px] text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-0.5 transition-colors"
                @click="selectedCategoryId = null"
              >
                <X :size="10" />
                Limpar
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              <button
                v-for="cat in expenseCategories"
                :key="cat.id"
                type="button"
                class="flex flex-col items-center p-3 rounded-xl border transition-all active:scale-95 cursor-pointer"
                :class="selectedCategoryId === cat.id ? 'border-primary bg-primary/10' : 'border-border/40 bg-muted/20'"
                @click="selectedCategoryId = selectedCategoryId === cat.id ? null : cat.id"
              >
                <span
                  class="size-12 rounded-xl flex items-center justify-center transition-all"
                  :style="selectedCategoryId === cat.id ? {} : { background: cat.color + '18' }"
                  :class="selectedCategoryId === cat.id ? 'bg-primary/10' : ''"
                >
                  <component
                    v-if="cat.icon && findIcon(cat.icon)"
                    :is="findIcon(cat.icon)!.component"
                    :size="22"
                    :style="{ color: cat.color }"
                  />
                  <span
                    v-else
                    class="text-[14px] font-bold"
                    :style="{ color: cat.color }"
                  >{{ cat.name.charAt(0) }}</span>
                </span>
                <span class="text-[12px] font-medium text-muted-foreground mt-1.5 text-center leading-tight">
                  {{ cat.name }}
                </span>
              </button>
            </div>
          </div>

          <p
            v-if="!financeStore.activeAccounts.length && !financeStore.activeCards.length"
            class="text-[12px] text-muted-foreground/50 py-1"
          >
            Nenhuma conta ou cartão cadastrado.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-background border-t border-border px-4 py-3">
        <button
          type="button"
          class="w-full h-[52px] rounded-xl font-semibold text-[15px] bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          :disabled="submitting || !canSubmit"
          @click="submit"
        >
          <Loader2 v-if="submitting" :size="14" class="animate-spin" />
          <Check v-else :size="14" />
          Finalizar compra
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
