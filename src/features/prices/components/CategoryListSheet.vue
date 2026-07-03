<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sheet, SheetContent } from '@ui/sheet'
import { Check, Loader2, Pencil, Plus, Tag, Trash2, X } from 'lucide-vue-next'
import { ConfirmDialog } from '@/components/shared'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import type { PriceCategory } from '@/features/prices/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const store = usePricesStore()
const toast = useToast()

const newName = ref('')
const creating = ref(false)
const editingId = ref<string | null>(null)
const editName = ref('')
const savingEdit = ref(false)
const deleteOpen = ref(false)
const deleteTarget = ref<PriceCategory | null>(null)
const deleting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (!store.categories.length) store.fetchCategories()
      newName.value = ''
      editingId.value = null
    }
  },
)

async function create() {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await store.createCategory({ name })
    toast.success('Categoria criada')
    newName.value = ''
  } catch {
    toast.error('Erro ao criar categoria')
  } finally {
    creating.value = false
  }
}

function startEdit(category: PriceCategory) {
  editingId.value = category.id
  editName.value = category.name
}

async function saveEdit() {
  if (!editingId.value) return
  const name = editName.value.trim()
  if (!name) return
  savingEdit.value = true
  try {
    await store.updateCategory(editingId.value, { name })
    toast.success('Categoria atualizada')
    editingId.value = null
  } catch {
    toast.error('Erro ao atualizar categoria')
  } finally {
    savingEdit.value = false
  }
}

function requestDelete(category: PriceCategory) {
  deleteTarget.value = category
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteCategory(deleteTarget.value.id)
    toast.success('Categoria excluída')
    deleteOpen.value = false
    deleteTarget.value = null
  } catch {
    toast.error('Erro ao excluir categoria')
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
      <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-border shrink-0" />

      <!-- Header -->
      <div class="px-5 pt-2 pb-3 shrink-0">
        <p class="text-[15px] font-semibold">Categorias</p>
        <p class="text-[12px] text-muted-foreground mt-0.5">Organize seus produtos por tipo</p>
      </div>

      <!-- Add row -->
      <div class="px-4 pb-3 flex gap-2 shrink-0">
        <input
          v-model="newName"
          type="text"
          placeholder="Nova categoria (ex: Eletrônicos)"
          class="flex-1 h-10 rounded-lg bg-card px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          @keydown.enter="create"
        />
        <button
          type="button"
          class="h-10 px-3.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1.5 text-[13px] font-medium disabled:opacity-40 transition-all active:scale-[0.98]"
          :disabled="creating || !newName.trim()"
          @click="create"
        >
          <Loader2 v-if="creating" :size="14" class="animate-spin" />
          <Plus v-else :size="14" />
          Adicionar
        </button>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto pb-8">
        <div v-if="store.loadingCategories" class="px-5 py-6 text-center">
          <Loader2 :size="18" class="animate-spin inline text-muted-foreground" />
        </div>
        <p v-else-if="store.categories.length === 0" class="text-[13px] text-muted-foreground px-5 py-8 text-center">
          Nenhuma categoria cadastrada ainda.
        </p>
        <ul v-else>
          <li
            v-for="category in store.categories"
            :key="category.id"
            class="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0"
          >
            <span class="size-8 rounded-lg bg-muted grid place-items-center shrink-0 text-muted-foreground">
              <Tag :size="14" />
            </span>

            <!-- Edit mode -->
            <template v-if="editingId === category.id">
              <input
                v-model="editName"
                type="text"
                class="flex-1 h-9 rounded-lg bg-card px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
                @keydown.enter="saveEdit"
              />
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-primary hover:brightness-110 transition-colors disabled:opacity-40"
                :disabled="savingEdit"
                @click="saveEdit"
              >
                <Loader2 v-if="savingEdit" :size="14" class="animate-spin" />
                <Check v-else :size="14" />
              </button>
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
                @click="editingId = null"
              >
                <X :size="14" />
              </button>
            </template>

            <!-- View mode -->
            <template v-else>
              <span class="flex-1 text-[13px] font-medium text-foreground truncate">{{ category.name }}</span>
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                @click="startEdit(category)"
              >
                <Pencil :size="13" />
              </button>
              <button
                type="button"
                class="size-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                @click="requestDelete(category)"
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
    title="Excluir categoria"
    :description="`'${deleteTarget?.name}' será removida. Os produtos ficam sem categoria.`"
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
