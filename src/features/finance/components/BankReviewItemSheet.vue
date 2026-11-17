<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useFinanceStore } from '@/stores/finance'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import type { BankReviewAction, BankReviewDecision, BankReviewItem } from '@/types/bankConnections'

/** Decide o que fazer com uma transação do banco que ainda não está no app. */
const props = defineProps<{ open: boolean; item: BankReviewItem | null; decision: BankReviewDecision | null }>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  save: [decision: BankReviewDecision]
  ignore: [id: string]
}>()

const store = useFinanceStore()
const draft = ref<BankReviewDecision | null>(null)

watch(() => [props.open, props.item?.id], () => {
  if (props.open && props.decision) draft.value = { ...props.decision }
}, { immediate: true })

const isCard = computed(() => props.item?.account.type === 'credit')
const isOut = computed(() => props.item?.direction === 'out')

const actions = computed<{ value: BankReviewAction; label: string }[]>(() => {
  if (!props.item) return []
  const list: { value: BankReviewAction; label: string }[] = []
  if (props.item.suggestion.transaction_id) {
    list.push(props.item.suggestion.action === 'match' ? { value: 'match', label: 'Já no app' } : { value: 'confirm', label: 'Previsão' })
  }
  if (isCard.value) {
    if (isOut.value) list.push({ value: 'expense', label: 'Compra' })
    else list.push({ value: 'income', label: 'Estorno' }, { value: 'pay_card', label: 'Fatura' })
  } else {
    list.push({ value: isOut.value ? 'expense' : 'income', label: isOut.value ? 'Despesa' : 'Receita' }, { value: 'transfer', label: 'Transferência' })
    if (isOut.value) list.push({ value: 'pay_card', label: 'Fatura' })
  }
  return list
})

const categoryType = computed(() => (draft.value?.action === 'income' ? 'income' : 'expense'))
const categories = computed(() => store.categories.filter((c) => c.type === categoryType.value))
const otherAccounts = computed(() => store.activeAccounts.filter((a) => a.name !== props.item?.account.ledger_name))

watch(() => props.open, (open) => {
  if (!open) return
  if (!store.categories.length) void store.fetchCategories()
  if (!store.accounts.length) void store.fetchAccounts()
  if (!store.cards.length) void store.fetchCards()
})

function setAction(action: BankReviewAction) {
  if (!draft.value) return
  draft.value.action = action
  // A category of the other type does not carry over
  if (action !== 'expense' && action !== 'income') draft.value.category_id = null
  else if (draft.value.category_id && !store.categories.some((c) => c.id === draft.value!.category_id && c.type === action)) draft.value.category_id = null
}

// ── Despesa dividida: minha parte ───────────────────────────────────────────
const shared = computed(() => draft.value?.own_share_cents != null)
const shareDisplay = computed(() =>
  draft.value?.own_share_cents ? (draft.value.own_share_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
)

function toggleShared() {
  if (!draft.value || !props.item) return
  draft.value.own_share_cents = shared.value ? null : Math.round(props.item.amount_cents / 2)
}

function onShareInput(e: Event) {
  if (!draft.value) return
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  draft.value.own_share_cents = digits ? parseInt(digits, 10) : 0
  ;(e.target as HTMLInputElement).value = shareDisplay.value
}

const valid = computed(() => {
  const d = draft.value
  if (!d) return false
  if (d.action === 'expense' && d.own_share_cents != null && (d.own_share_cents <= 0 || d.own_share_cents >= (props.item?.amount_cents ?? 0))) return false
  if (d.action === 'transfer') return !!d.account_id
  if (d.action === 'pay_card') return isCard.value ? !!d.account_id : !!d.card_id
  if (d.action === 'confirm' || d.action === 'match') return !!d.transaction_id
  return !!(d.description ?? '').trim()
})

function save() {
  if (draft.value && valid.value) {
    const ownShare = draft.value.action === 'expense' && !isCard.value ? draft.value.own_share_cents ?? null : null
    emit('save', { ...draft.value, own_share_cents: ownShare, description: (draft.value.description ?? '').trim() })
    emit('update:open', false)
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-2xl p-0 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
      <SheetHeader v-if="item" class="text-left px-5 pt-3">
        <SheetTitle class="text-[15px] pr-6 flex items-baseline justify-between gap-3">
          <span class="truncate">{{ item.account.ledger_name ?? item.account.name }}</span>
          <span class="tabular-nums whitespace-nowrap" :class="item.direction === 'in' ? 'text-success' : 'text-foreground'">
            {{ item.direction === 'in' ? '+' : '−' }}{{ formatCurrency(item.amount_cents / 100) }}
          </span>
        </SheetTitle>
        <SheetDescription class="text-[12px]">
          {{ formatDate(item.date) }} · {{ item.description }}
        </SheetDescription>
      </SheetHeader>

      <form v-if="item && draft" class="px-5 pb-6 space-y-5 mt-4" @submit.prevent="save">
        <!-- O que é -->
        <div class="flex gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="O que é">
          <button
            v-for="a in actions"
            :key="a.value"
            type="button"
            role="radio"
            :aria-checked="draft.action === a.value"
            class="flex-1 h-9 rounded-md text-[12px] transition-colors"
            :class="draft.action === a.value ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'"
            @click="setAction(a.value)"
          >
            {{ a.label }}
          </button>
        </div>

        <p v-if="draft.action === 'confirm'" class="rounded-md bg-muted px-3 py-2 text-[12px] leading-snug">
          Confirma a previsão <span class="font-medium">{{ item.suggestion.description }}</span> com o valor e a data do banco.
          Nada novo é criado.
        </p>

        <p v-else-if="draft.action === 'match'" class="rounded-md bg-muted px-3 py-2 text-[12px] leading-snug">
          Já está no app como <span class="font-medium">{{ item.suggestion.description }}</span> (ex.: assinatura do cartão).
          Liga os dois e o lançamento fica com o valor e a data do banco (no cartão, também a fatura). Nada novo é criado.
        </p>

        <p v-else-if="draft.action === 'pay_card'" class="rounded-md bg-muted px-3 py-2 text-[12px] leading-snug">
          Pagamento da fatura do cartão. Não conta como despesa: as compras já contaram quando foram feitas.
        </p>

        <section v-if="draft.action === 'expense' || draft.action === 'income' || draft.action === 'transfer'">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Descrição</p>
          <input
            v-model="draft.description"
            type="text"
            maxlength="255"
            aria-label="Descrição"
            class="w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </section>

        <section v-if="draft.action === 'expense' || draft.action === 'income'">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Categoria</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="c in categories"
              :key="c.id"
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] transition-colors"
              :class="draft.category_id === c.id ? 'bg-primary/15 text-primary font-semibold' : 'bg-muted text-muted-foreground hover:text-foreground'"
              @click="draft.category_id = draft.category_id === c.id ? null : c.id"
            >
              <span class="size-2 rounded-full shrink-0" :style="{ background: c.color }" />
              {{ c.name }}
            </button>
          </div>
        </section>

        <section v-if="draft.action === 'expense' && !isCard" class="rounded-md bg-muted px-3 py-2.5 text-[12px] leading-snug space-y-2">
          <label class="flex items-start gap-3 cursor-pointer">
            <input :checked="shared" type="checkbox" class="mt-0.5 size-4 accent-[hsl(var(--primary))]" @change="toggleShared" />
            <span>
              <span class="font-medium text-foreground">Dividida com outras pessoas</span>
              <span class="block text-muted-foreground">Só a sua parte conta como gasto; o que os outros devolverem entra como reembolso.</span>
            </span>
          </label>
          <div v-if="shared" class="flex items-center gap-2 h-11 px-3 rounded-lg bg-card focus-within:ring-2 focus-within:ring-primary">
            <span class="text-[13px] text-muted-foreground shrink-0">Minha parte R$</span>
            <input
              :value="shareDisplay"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              aria-label="Minha parte em reais"
              class="flex-1 bg-transparent text-[14px] text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
              @input="onShareInput"
            />
          </div>
        </section>

        <label v-if="draft.action === 'income'" class="flex items-start gap-3 rounded-md bg-muted px-3 py-2.5 text-[12px] leading-snug cursor-pointer">
          <input v-model="draft.is_reimbursement" type="checkbox" class="mt-0.5 size-4 accent-[hsl(var(--primary))]" />
          <span>
            <span class="font-medium text-foreground">É reembolso</span>
            <span class="block text-muted-foreground">Dinheiro que volta de uma despesa (ex.: amigo pagando a parte dele). Não conta como receita.</span>
          </span>
        </label>

        <section v-if="draft.action === 'transfer' || (draft.action === 'pay_card' && isCard)">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {{ draft.action === 'pay_card' ? 'Conta que pagou' : isOut ? 'Para qual conta foi' : 'De qual conta veio' }}
          </p>
          <div class="relative">
            <select
              v-model="draft.account_id"
              aria-label="Outra conta"
              class="w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none"
            >
              <option :value="null" disabled>Escolha a conta</option>
              <option v-for="a in (draft.action === 'pay_card' ? store.activeAccounts : otherAccounts)" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
            <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </section>

        <section v-if="draft.action === 'pay_card' && !isCard">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Cartão</p>
          <div class="relative">
            <select
              v-model="draft.card_id"
              aria-label="Cartão"
              class="w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none"
            >
              <option :value="null" disabled>Escolha o cartão</option>
              <option v-for="c in store.cards" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </section>

        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-muted text-muted-foreground"
            @click="emit('ignore', item.id); emit('update:open', false)"
          >
            Ignorar
          </button>
          <button
            type="submit"
            class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-primary text-primary-foreground disabled:opacity-40"
            :disabled="!valid"
          >
            Pronto
          </button>
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>
