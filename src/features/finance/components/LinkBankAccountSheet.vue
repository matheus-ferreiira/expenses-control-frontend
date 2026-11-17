<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, Loader2 } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useFinanceStore } from '@/stores/finance'
import { bankConnectionsApi } from '@/services/api/bankConnections'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/date'
import type { BankConnection, BankConnectionAccount } from '@/types/bankConnections'

/**
 * Liga uma conta do banco a uma conta do app (ou o cartão a um cartão). A partir do dia escolhido, o que o
 * banco mostra e não estiver no app vai para "A lançar"; o que já estiver é só conferido.
 */
const props = defineProps<{ open: boolean; account: BankConnectionAccount | null; bankName: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [connection: BankConnection] }>()

const store = useFinanceStore()
const toast = useToast()
const ledgerId = ref('')
const importFrom = ref('')
const saving = ref(false)

const isCard = computed(() => props.account?.type === 'credit')
const options = computed(() =>
  isCard.value
    ? store.cards.filter((c) => c.is_active !== false).map((c) => ({ id: c.id, name: c.name }))
    : store.activeAccounts.map((a) => ({ id: a.id, name: a.name })),
)

watch(() => [props.open, props.account?.id], () => {
  if (!props.open || !props.account) return
  if (!store.accounts.length) void store.fetchAccounts()
  if (!store.cards.length) void store.fetchCards()
  const link = props.account.link
  ledgerId.value = (isCard.value ? link?.credit_card_id : link?.bank_account_id) ?? ''
  importFrom.value = link?.import_from ?? ''
}, { immediate: true })

async function save(unlink = false) {
  if (!props.account || saving.value || (!unlink && !ledgerId.value)) return
  saving.value = true
  try {
    const id = unlink ? null : ledgerId.value
    const connection = await bankConnectionsApi.link(props.account.id, {
      [isCard.value ? 'credit_card_id' : 'bank_account_id']: id,
      import_from: unlink ? null : importFrom.value || null,
    })
    const updated = connection.accounts.find((a) => a.id === props.account!.id)
    if (unlink) toast.success('Conta desligada')
    else if (updated?.link?.import_from) {
      toast.success(
        `Ligada a ${updated.link.name}`,
        updated.to_review_count
          ? `${updated.to_review_count} para lançar desde ${formatDate(updated.link.import_from)}`
          : `Tudo conferido desde ${formatDate(updated.link.import_from)}`,
      )
    }
    emit('saved', connection)
    emit('update:open', false)
  } catch (e) {
    const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    toast.error(data?.errors ? Object.values(data.errors)[0]?.[0] ?? 'Não foi possível ligar' : data?.message ?? 'Não foi possível ligar')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-2xl p-0 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
      <SheetHeader class="text-left px-5 pt-3">
        <SheetTitle class="text-[15px]">Ligar ao app · {{ account?.name }}</SheetTitle>
        <SheetDescription class="text-[12px]">
          {{ bankName }}. O que já estiver no app é só conferido; o que faltar vai para "A lançar" e só entra com sua aprovação.
        </SheetDescription>
      </SheetHeader>

      <form class="px-5 pb-6 space-y-5 mt-4" @submit.prevent="save()">
        <section>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {{ isCard ? 'Cartão do app' : 'Conta do app' }}
          </p>
          <div class="relative">
            <select
              v-model="ledgerId"
              :aria-label="isCard ? 'Cartão do app' : 'Conta do app'"
              class="w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none"
              :class="!ledgerId ? 'text-muted-foreground' : ''"
            >
              <option value="" disabled>{{ isCard ? 'Escolha o cartão' : 'Escolha a conta' }}</option>
              <option v-for="o in options" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
            <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </section>

        <section>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Lançar a partir de</p>
          <input
            v-model="importFrom"
            type="date"
            aria-label="Lançar a partir de"
            class="w-full h-11 rounded-lg bg-muted px-3 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <p class="text-[11px] text-muted-foreground leading-snug mt-1.5">
            Em branco, o app acha o dia em que ele e o banco deixam de bater. O que for de antes fica como está.
          </p>
        </section>

        <div class="flex gap-2 pt-1">
          <button
            v-if="account?.link"
            type="button"
            class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-muted text-destructive disabled:opacity-40"
            :disabled="saving"
            @click="save(true)"
          >
            Desligar
          </button>
          <button
            v-else
            type="button"
            class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-muted text-foreground"
            @click="emit('update:open', false)"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 h-11 rounded-lg text-[14px] font-medium bg-primary text-primary-foreground disabled:opacity-40 inline-flex items-center justify-center gap-2"
            :disabled="!ledgerId || saving"
          >
            <Loader2 v-if="saving" :size="15" class="animate-spin" />
            {{ account?.link ? 'Salvar' : 'Ligar' }}
          </button>
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>
