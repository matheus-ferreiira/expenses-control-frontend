<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Check, Loader2, Pencil, Plus, Store as StoreIcon, Trash2, X } from 'lucide-vue-next'
import { ConfirmDialog } from '@/components/shared'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import type { PriceStore } from '@/features/prices/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const store = usePricesStore()
const toast = useToast()

const newForm = reactive({ name: '', website_url: '' })
const creating = ref(false)
const editingId = ref<string | null>(null)
const editForm = reactive({ name: '', website_url: '' })
const savingEdit = ref(false)
const deleteOpen = ref(false)
const deleteTarget = ref<PriceStore | null>(null)
const deleting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (!store.stores.length) store.fetchStores()
      newForm.name = ''
      newForm.website_url = ''
      editingId.value = null
    }
  },
)

async function create() {
  const name = newForm.name.trim()
  if (!name) return
  creating.value = true
  try {
    await store.createStore({ name, website_url: newForm.website_url.trim() || null })
    toast.success('Loja criada')
    newForm.name = ''
    newForm.website_url = ''
  } catch {
    toast.error('Erro ao criar loja')
  } finally {
    creating.value = false
  }
}

function startEdit(item: PriceStore) {
  editingId.value = item.id
  editForm.name = item.name
  editForm.website_url = item.website_url ?? ''
}

async function saveEdit() {
  if (!editingId.value) return
  const name = editForm.name.trim()
  if (!name) return
  savingEdit.value = true
  try {
    await store.updateStore(editingId.value, {
      name,
      website_url: editForm.website_url.trim() || null,
    })
    toast.success('Loja atualizada')
    editingId.value = null
  } catch {
    toast.error('Erro ao atualizar loja')
  } finally {
    savingEdit.value = false
  }
}

function requestDelete(item: PriceStore) {
  deleteTarget.value = item
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteStore(deleteTarget.value.id)
    toast.success('Loja excluída')
    deleteOpen.value = false
    deleteTarget.value = null
  } catch {
    toast.error('Erro ao excluir loja')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-2xl border-t-2 border-primary bg-background p-0 max-h-[92vh] flex flex-col [&>button]:hidden"
    >
      <!-- Drag handle -->
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/20 shrink-0" />

      <!-- Header -->
      <div class="px-5 pt-2 pb-3 shrink-0">
        <p class="text-[15px] font-semibold">Lojas</p>
        <p class="text-[12px] text-muted-foreground mt-0.5">Onde você pesquisa e compra seus produtos</p>
      </div>

      <!-- Add row -->
      <div class="px-4 pb-3 space-y-2 shrink-0">
        <div class="flex gap-2">
          <input
            v-model="newForm.name"
            type="text"
            placeholder="Nova loja (ex: Kabum)"
            class="flex-1 h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
            @keydown.enter="create"
          />
          <button
            type="button"
            class="h-10 px-3.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1.5 text-[13px] font-medium disabled:opacity-40 transition-all active:scale-[0.98]"
            :disabled="creating || !newForm.name.trim()"
            @click="create"
          >
            <Loader2 v-if="creating" :size="14" class="animate-spin" />
            <Plus v-else :size="14" />
            Adicionar
          </button>
        </div>
        <input
          v-model="newForm.website_url"
          type="url"
          inputmode="url"
          placeholder="Site (opcional) — https://..."
          class="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
          @keydown.enter="create"
        />
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto pb-8">
        <div v-if="store.loadingStores" class="px-5 py-6 text-center">
          <Loader2 :size="18" class="animate-spin inline text-muted-foreground/50" />
        </div>
        <p v-else-if="store.stores.length === 0" class="text-[13px] text-muted-foreground/60 px-5 py-8 text-center">
          Nenhuma loja cadastrada ainda.
        </p>
        <ul v-else>
          <li
            v-for="item in store.stores"
            :key="item.id"
            class="flex items-center gap-3 px-5 py-3 border-b border-border/30 last:border-0"
          >
            <span class="size-8 rounded-lg bg-muted/40 grid place-items-center shrink-0 text-muted-foreground">
              <StoreIcon :size="14" />
            </span>

            <!-- Edit mode -->
            <template v-if="editingId === item.id">
              <div class="flex-1 space-y-1.5 min-w-0">
                <input
                  v-model="editForm.name"
                  type="text"
                  class="w-full h-9 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60"
                  @keydown.enter="saveEdit"
                />
                <input
                  v-model="editForm.website_url"
                  type="url"
                  placeholder="https://..."
                  class="w-full h-9 rounded-lg bg-card border border-border/60 px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/40"
                  @keydown.enter="saveEdit"
                />
              </div>
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                :disabled="savingEdit"
                @click="saveEdit"
              >
                <Loader2 v-if="savingEdit" :size="14" class="animate-spin" />
                <Check v-else :size="14" />
              </button>
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted/40 transition-colors"
                @click="editingId = null"
              >
                <X :size="14" />
              </button>
            </template>

            <!-- View mode -->
            <template v-else>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-foreground truncate">{{ item.name }}</p>
                <p v-if="item.website_url" class="text-[11px] text-muted-foreground/60 truncate">
                  {{ item.website_url }}
                </p>
              </div>
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                @click="startEdit(item)"
              >
                <Pencil :size="13" />
              </button>
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                @click="requestDelete(item)"
              >
                <Trash2 :size="13" />
              </button>
            </template>
          </li>
        </ul>
      </div>
    </SheetContent>
  </Sheet>

  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir loja"
    :description="`'${deleteTarget?.name}' e todos os registros de preço dela serão removidos.`"
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
