<script setup lang="ts">
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
import { ref, computed, onMounted } from 'vue'
import { AppPageContainer, ConfirmDialog, EmptyState, PageHeader } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { financeApi } from '@/services/api/finance'
import { Skeleton } from '@ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from 'lucide-vue-next'
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
const deleting = ref(false)
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

const groups = computed(() => [
  { type: 'expense' as const, label: 'Despesas', categories: expenseCategories.value, empty: 'Nenhuma categoria de despesa.' },
  { type: 'income' as const, label: 'Receitas', categories: incomeCategories.value, empty: 'Nenhuma categoria de receita.' },
])

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
  deleting.value = true
  try {
    await financeApi.categories.delete(id)
    store.categories = store.categories.filter((c) => c.id !== id)
    toast.success('Categoria removida')
    deleteDialogOpen.value = false
    categoryToDelete.value = null
  } catch {
    toast.error('Erro ao remover categoria')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <AppPageContainer>
    <FinanceSubNav />
    <PageHeader title="Categorias" subtitle="Organize despesas e receitas por categoria." compact-mobile>
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors shrink-0"
          @click="openCreate()"
        >
          <Plus class="size-3.5" />
          Nova categoria
        </button>
      </template>
    </PageHeader>

    <!-- Loading: list-shaped, two columns on desktop -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 xl:gap-6 lg:items-start">
      <div v-for="i in 2" :key="i" class="bg-card rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-border"><Skeleton class="h-2.5 w-20" /></div>
        <div v-for="j in 4" :key="j" class="flex items-center gap-3 px-4 py-2.5">
          <Skeleton class="size-8 rounded-lg shrink-0" />
          <Skeleton class="h-3 w-1/3" />
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="!expenseCategories.length && !incomeCategories.length"
      :icon="Tags"
      title="Nenhuma categoria ainda"
      description="Crie categorias para organizar suas transações."
      cta-label="Criar primeira categoria"
      @cta="openCreate()"
    />

    <!-- Despesas and Receitas side by side on desktop -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 xl:gap-6 lg:items-start">
      <section v-for="group in groups" :key="group.type" class="bg-card rounded-lg overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{{ group.label }}</p>
          <span v-if="group.categories.length" class="text-[11px] text-muted-foreground">
            {{ group.categories.length }} categoria{{ group.categories.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <ul class="divide-y divide-border">
          <li v-if="!group.categories.length" class="px-4 py-3 text-[12px] text-muted-foreground">{{ group.empty }}</li>

          <!-- Tap the row to edit; delete stays in the menu -->
          <li v-for="cat in group.categories" :key="cat.id" class="flex items-center">
            <button
              type="button"
              class="flex-1 min-w-0 flex items-center gap-3 pl-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
              :aria-label="`Editar categoria ${cat.name}`"
              @click="openEdit(cat)"
            >
              <span
                class="size-8 rounded-lg grid place-items-center shrink-0"
                :style="{
                  background: (cat.color ?? (group.type === 'expense' ? '#FF6F5C' : '#34d399')) + '26',
                  color: cat.color ?? (group.type === 'expense' ? '#FF6F5C' : '#34d399'),
                }"
              >
                <component
                  v-if="cat.icon && findIcon(cat.icon)"
                  :is="findIcon(cat.icon)!.component"
                  :size="15"
                  :stroke-width="1.9"
                  aria-hidden="true"
                />
                <span v-else class="text-[12px] font-semibold">{{ cat.name.charAt(0) }}</span>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-medium text-foreground truncate">{{ cat.name }}</p>
                <p v-if="cat.monthly_limit" class="text-[12px] text-muted-foreground tabular-nums truncate mt-0.5">
                  Meta de {{ formatCurrency(cat.monthly_limit) }} por mês
                </p>
              </div>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  :aria-label="`Opções da categoria ${cat.name}`"
                  class="size-10 mr-1 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                >
                  <MoreHorizontal :size="15" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-36">
                <DropdownMenuItem @click="openEdit(cat)">
                  <Pencil :size="12" class="mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDelete(cat)">
                  <Trash2 :size="12" class="mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>

          <li>
            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-primary hover:bg-muted/50 transition-colors"
              @click="openCreate(group.type)"
            >
              <Plus :size="14" />
              Adicionar categoria
            </button>
          </li>
        </ul>
      </section>
    </div>

    <CategoryFormSheet
      v-model:open="formOpen"
      :category="editingCategory"
      :default-type="defaultFormType"
      @saved="() => {}"
    />

    <ConfirmDialog
      v-model:open="deleteDialogOpen"
      title="Excluir categoria"
      :description="`Excluir '${categoryToDelete?.name}'? As transações dela ficam sem categoria.`"
      confirm-label="Excluir"
      variant="destructive"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </AppPageContainer>
</template>
