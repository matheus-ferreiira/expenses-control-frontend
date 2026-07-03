<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AppPageContainer } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { financeApi } from '@/services/api/finance'
import { Skeleton } from '@ui/skeleton'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@ui/alert-dialog'
import { Plus, Pencil, Trash2, Loader2, Tags, Tag } from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import { formatCurrency } from '@/utils/currency'
import CategoryFormSheet from '@/features/finance/components/CategoryFormSheet.vue'
import type { TransactionCategory } from '@/types/finance'

const store = useFinanceStore()
const toast = useToast()

const loading = ref(false)
const formOpen = ref(false)
const editingCategory = ref<TransactionCategory | null>(null)
const defaultFormType = ref<'expense' | 'income'>('expense')
const deletingId = ref<string | null>(null)
const deleteDialogOpen = ref(false)
const categoryToDelete = ref<TransactionCategory | null>(null)

onMounted(async () => {
  if (!store.categories.length) {
    loading.value = true
    try {
      await store.fetchCategories()
    } finally {
      loading.value = false
    }
  }
})

const expenseCategories = computed(() =>
  store.categories.filter((c) => c.type === 'expense'),
)
const incomeCategories = computed(() =>
  store.categories.filter((c) => c.type === 'income'),
)

function openCreate(type: 'expense' | 'income' = 'expense') {
  editingCategory.value = null
  defaultFormType.value = type
  formOpen.value = true
}

function openEdit(cat: TransactionCategory) {
  editingCategory.value = cat
  formOpen.value = true
}

function openDelete(category: TransactionCategory) {
  categoryToDelete.value = category
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!categoryToDelete.value) return
  const id = categoryToDelete.value.id
  deletingId.value = id
  deleteDialogOpen.value = false
  try {
    await financeApi.categories.delete(id)
    store.categories = store.categories.filter((c) => c.id !== id)
    toast.success('Categoria removida')
  } catch {
    toast.error('Erro ao remover categoria')
  } finally {
    deletingId.value = null
    categoryToDelete.value = null
  }
}
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="mb-1">
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            Finanças
          </p>
          <h1 class="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
            Categorias
          </h1>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors shrink-0"
          @click="openCreate()"
        >
          <Plus :size="14" :stroke-width="2.5" />
          Nova categoria
        </button>
      </div>

  
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 6" :key="i" class="h-[68px] w-full rounded-lg" />
    </div>

    <template v-else>

      <!-- Empty state -->
      <div
        v-if="!expenseCategories.length && !incomeCategories.length"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <Tags :size="40" class="text-muted-foreground mb-4" />
        <p class="text-[15px] font-semibold text-foreground">Nenhuma categoria ainda</p>
        <p class="text-[13px] text-muted-foreground mt-1 mb-5">
          Crie categorias para organizar suas transações
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          @click="openCreate()"
        >
          <Plus :size="14" />
          Criar primeira categoria
        </button>
      </div>

      <div v-else class="space-y-6">

        <!-- Despesas -->
        <section>
          <div class="bg-card rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
              <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                DESPESAS
              </p>
              <button
                type="button"
                class="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                @click="openCreate('expense')"
              >
                + Adicionar
              </button>
            </div>
            <!-- Per-section empty state -->
            <div v-if="!expenseCategories.length" class="border-t border-border px-4 py-6 flex flex-col items-center gap-3">
              <Tag :size="16" class="text-muted-foreground" />
              <p class="text-[13px] text-muted-foreground">Nenhuma categoria de despesa criada.</p>
              <button
                type="button"
                class="h-8 px-3 rounded-lg text-[12px] text-muted-foreground hover:bg-muted transition-colors"
                @click="openCreate('expense')"
              >
                Adicionar
              </button>
            </div>
            <div
              v-for="cat in expenseCategories"
              :key="cat.id"
              class="border-t border-border flex items-center gap-3 px-4 h-[52px]"
            >
              <span
                class="size-8 rounded-lg flex items-center justify-center shrink-0"
                :style="{ background: (cat.color ?? 'hsl(var(--destructive))') + '22', color: cat.color ?? 'hsl(var(--destructive))' }"
              >
                <component
                  v-if="cat.icon && findIcon(cat.icon)"
                  :is="findIcon(cat.icon)!.component"
                  :size="15"
                  :stroke-width="1.8"
                  aria-hidden="true"
                />
                <span v-else class="text-[13px] font-bold">{{ cat.name.charAt(0) }}</span>
              </span>

              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-medium text-foreground leading-none">{{ cat.name }}</p>
              </div>

              <span v-if="cat.monthly_limit" class="text-[12px] text-muted-foreground shrink-0">
                {{ formatCurrency(cat.monthly_limit) }}
              </span>

              <button
                type="button"
                class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                @click="openEdit(cat)"
              >
                <Pencil :size="14" aria-hidden="true" />
              </button>
              <button
                type="button"
                :disabled="deletingId === cat.id"
                class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                @click="openDelete(cat)"
              >
                <Loader2 v-if="deletingId === cat.id" :size="14" class="animate-spin" />
                <Trash2 v-else :size="14" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <!-- Receitas -->
        <section>
          <div class="bg-card rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
              <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                RECEITAS
              </p>
              <button
                type="button"
                class="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                @click="openCreate('income')"
              >
                + Adicionar
              </button>
            </div>
            <!-- Per-section empty state -->
            <div v-if="!incomeCategories.length" class="border-t border-border px-4 py-6 flex flex-col items-center gap-3">
              <Tag :size="16" class="text-muted-foreground" />
              <p class="text-[13px] text-muted-foreground">Nenhuma categoria de receita criada.</p>
              <button
                type="button"
                class="h-8 px-3 rounded-lg text-[12px] text-muted-foreground hover:bg-muted transition-colors"
                @click="openCreate('income')"
              >
                Adicionar
              </button>
            </div>
            <div
              v-for="cat in incomeCategories"
              :key="cat.id"
              class="border-t border-border flex items-center gap-3 px-4 h-[52px]"
            >
              <span
                class="size-8 rounded-lg flex items-center justify-center shrink-0"
                :style="{ background: (cat.color ?? 'hsl(var(--success))') + '22', color: cat.color ?? 'hsl(var(--success))' }"
              >
                <component
                  v-if="cat.icon && findIcon(cat.icon)"
                  :is="findIcon(cat.icon)!.component"
                  :size="15"
                  :stroke-width="1.8"
                  aria-hidden="true"
                />
                <span v-else class="text-[13px] font-bold">{{ cat.name.charAt(0) }}</span>
              </span>

              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-medium text-foreground leading-none">{{ cat.name }}</p>
              </div>

              <span v-if="cat.monthly_limit" class="text-[12px] text-muted-foreground shrink-0">
                {{ formatCurrency(cat.monthly_limit) }}
              </span>

              <button
                type="button"
                class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                @click="openEdit(cat)"
              >
                <Pencil :size="14" aria-hidden="true" />
              </button>
              <button
                type="button"
                :disabled="deletingId === cat.id"
                class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                @click="openDelete(cat)"
              >
                <Loader2 v-if="deletingId === cat.id" :size="14" class="animate-spin" />
                <Trash2 v-else :size="14" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

      </div>
    </template>

    <!-- Category form sheet -->
    <CategoryFormSheet
      v-model:open="formOpen"
      :category="editingCategory"
      :default-type="defaultFormType"
      @saved="() => {}"
    />

    <!-- Delete confirmation dialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent class="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong class="text-foreground">{{ categoryToDelete?.name }}</strong>?
            As transações vinculadas ficarão sem categoria.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-muted"
            @click="confirmDelete"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </AppPageContainer>
</template>
