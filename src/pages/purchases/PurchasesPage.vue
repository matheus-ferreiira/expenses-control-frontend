<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShoppingCart, Trash2, Loader2 } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Badge } from '@ui/badge'
import { EmptyState } from '@/components/shared'
import { usePurchaseStore } from '@/stores/purchases'
import { useToast } from '@/composables/useToast'

const store = usePurchaseStore()
const toast = useToast()

const newName = ref('')
const newCategory = ref('')
const adding = ref(false)

onMounted(() => store.fetchItems())

const pendingItems = computed(() => store.items.filter((i) => !i.is_bought))
const boughtItems = computed(() => store.items.filter((i) => i.is_bought))

const groupedPending = computed(() => {
  const groups: Record<string, typeof store.items> = {}
  for (const item of pendingItems.value) {
    const key = item.category || 'Sem categoria'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
})

async function addItem() {
  const name = newName.value.trim()
  if (!name) return
  adding.value = true
  try {
    await store.addItem(name, newCategory.value.trim() || undefined)
    newName.value = ''
    newCategory.value = ''
  } catch {
    toast.error('Erro ao adicionar item')
  } finally {
    adding.value = false
  }
}

async function toggle(id: string) {
  try {
    await store.toggleBought(id)
  } catch {
    toast.error('Erro ao atualizar item')
  }
}

async function remove(id: string) {
  try {
    await store.removeItem(id)
  } catch {
    toast.error('Erro ao remover item')
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') addItem()
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <p class="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5 select-none" style="color: hsl(var(--muted-foreground) / 0.4)">PESSOAL</p>
        <h1 class="text-[22px] font-semibold text-foreground tracking-tight leading-tight">Compras</h1>
        <p class="mt-1 text-[13px] text-muted-foreground/60">Organize sua lista de compras e desejos.</p>
      </div>
      <Badge variant="secondary" class="mt-1 shrink-0">
        {{ pendingItems.length }} pendente{{ pendingItems.length !== 1 ? 's' : '' }}
      </Badge>
    </div>

    <!-- Add form -->
    <div class="flex gap-2">
      <Input
        v-model="newName"
        placeholder="Nome do item..."
        class="flex-1"
        @keydown="handleKeydown"
      />
      <Input
        v-model="newCategory"
        placeholder="Categoria (opcional)"
        class="w-44"
        @keydown="handleKeydown"
      />
      <Button :disabled="adding || !newName.trim()" @click="addItem">
        <Loader2 v-if="adding" :size="14" class="mr-1.5 animate-spin" />
        Adicionar
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-12 text-muted-foreground">
      <Loader2 :size="20" class="animate-spin mr-2" />
      Carregando...
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="store.items.length === 0"
      :icon="ShoppingCart"
      title="Lista vazia"
      description="Adicione itens acima para começar sua lista de compras."
    />

    <!-- Pending items grouped by category -->
    <div v-else class="space-y-5">
      <template v-for="(items, category) in groupedPending" :key="category">
        <div class="space-y-1">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            {{ category }}
          </p>
          <div class="rounded-lg border divide-y divide-border overflow-hidden">
            <div
              v-for="item in items"
              :key="item.id"
              class="flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-accent/30 transition-base"
            >
              <Checkbox
                :id="`item-${item.id}`"
                :checked="item.is_bought"
                @update:checked="toggle(item.id)"
              />
              <label
                :for="`item-${item.id}`"
                class="flex-1 text-sm cursor-pointer select-none"
                :class="item.is_bought ? 'line-through text-muted-foreground' : ''"
              >
                {{ item.name }}
              </label>
              <button
                class="text-muted-foreground hover:text-destructive transition-base p-1"
                @click="remove(item.id)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Bought items -->
      <div v-if="boughtItems.length > 0" class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Comprados ({{ boughtItems.length }})
        </p>
        <div class="rounded-lg border divide-y divide-border overflow-hidden opacity-60">
          <div
            v-for="item in boughtItems"
            :key="item.id"
            class="flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-accent/30 transition-base"
          >
            <Checkbox
              :id="`item-${item.id}`"
              :checked="item.is_bought"
              @update:checked="toggle(item.id)"
            />
            <label
              :for="`item-${item.id}`"
              class="flex-1 text-sm cursor-pointer select-none line-through text-muted-foreground"
            >
              {{ item.name }}
              <span v-if="item.category" class="ml-1 text-xs opacity-60">· {{ item.category }}</span>
            </label>
            <button
              class="text-muted-foreground hover:text-destructive transition-base p-1"
              @click="remove(item.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
