<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AppPageContainer } from '@/components/shared'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { financeApi } from '@/services/api/finance'
import { Skeleton } from '@ui/skeleton'
import { Plus, Pencil, Trash2, Loader2, Tags } from 'lucide-vue-next'
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
const confirmDeleteId = ref<string | null>(null)

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

function requestDelete(id: string) {
  confirmDeleteId.value = id
}

function cancelDelete() {
  confirmDeleteId.value = null
}

async function confirmDelete(id: string) {
  deletingId.value = id
  confirmDeleteId.value = null
  try {
    await financeApi.categories.delete(id)
    store.categories = store.categories.filter((c) => c.id !== id)
    toast.success('Categoria removida')
  } catch {
    toast.error('Erro ao remover categoria')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="mb-1">
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-1.5">
            Finanças
          </p>
          <h1 class="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
            Categorias
          </h1>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors shrink-0"
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
        <Tags :size="40" class="text-muted-foreground/20 mb-4" />
        <p class="text-[15px] font-semibold text-foreground">Nenhuma categoria ainda</p>
        <p class="text-[13px] text-muted-foreground/60 mt-1 mb-5">
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
        <section v-if="expenseCategories.length">
          <div class="bg-card rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
              <p class="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                DESPESAS
              </p>
              <button
                type="button"
                class="text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
                @click="openCreate('expense')"
              >
                + Adicionar
              </button>
            </div>
            <div
              v-for="cat in expenseCategories"
              :key="cat.id"
              class="border-t border-border/30"
            >
              <!-- Confirm delete overlay -->
              <template v-if="confirmDeleteId === cat.id">
                <div class="flex items-center justify-between px-4 py-3.5 gap-3">
                  <p class="text-[13px] text-foreground/80">Remover <strong>{{ cat.name }}</strong>?</p>
                  <div class="flex gap-2 shrink-0">
                    <button
                      type="button"
                      class="h-8 px-3 rounded-lg text-[12px] border border-border/60 text-muted-foreground hover:bg-muted transition-colors"
                      @click="cancelDelete"
                    >Cancelar</button>
                    <button
                      type="button"
                      :disabled="deletingId === cat.id"
                      class="h-8 px-3 rounded-lg text-[12px] font-semibold bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
                      @click="confirmDelete(cat.id)"
                    >
                      <Loader2 v-if="deletingId === cat.id" :size="12" class="animate-spin" />
                      <span v-else>Remover</span>
                    </button>
                  </div>
                </div>
              </template>

              <!-- Normal view -->
              <template v-else>
                <div class="flex items-center gap-3 px-4 h-[52px]">
                  <span
                    class="size-8 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ background: (cat.color ?? 'hsl(var(--destructive))') + '22', color: cat.color ?? 'hsl(var(--destructive))' }"
                  >
                    <component
                      v-if="cat.icon && findIcon(cat.icon)"
                      :is="findIcon(cat.icon)!.component"
                      :size="15"
                      :stroke-width="1.8"
                    />
                    <span v-else class="text-[13px] font-bold">{{ cat.name.charAt(0) }}</span>
                  </span>

                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-medium text-foreground leading-none">{{ cat.name }}</p>
                  </div>

                  <span
                    v-if="cat.monthly_limit"
                    class="text-[12px] text-muted-foreground shrink-0"
                  >
                    {{ formatCurrency(cat.monthly_limit) }}
                  </span>

                  <button
                    type="button"
                    class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    @click="openEdit(cat)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    type="button"
                    :disabled="deletingId === cat.id"
                    class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    @click="requestDelete(cat.id)"
                  >
                    <Loader2 v-if="deletingId === cat.id" :size="14" class="animate-spin" />
                    <Trash2 v-else :size="14" />
                  </button>
                </div>
              </template>
            </div>
          </div>
        </section>

        <!-- Receitas -->
        <section v-if="incomeCategories.length">
          <div class="bg-card rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
              <p class="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                RECEITAS
              </p>
              <button
                type="button"
                class="text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
                @click="openCreate('income')"
              >
                + Adicionar
              </button>
            </div>
            <div
              v-for="cat in incomeCategories"
              :key="cat.id"
              class="border-t border-border/30"
            >
              <!-- Confirm delete overlay -->
              <template v-if="confirmDeleteId === cat.id">
                <div class="flex items-center justify-between px-4 py-3.5 gap-3">
                  <p class="text-[13px] text-foreground/80">Remover <strong>{{ cat.name }}</strong>?</p>
                  <div class="flex gap-2 shrink-0">
                    <button
                      type="button"
                      class="h-8 px-3 rounded-lg text-[12px] border border-border/60 text-muted-foreground hover:bg-muted transition-colors"
                      @click="cancelDelete"
                    >Cancelar</button>
                    <button
                      type="button"
                      :disabled="deletingId === cat.id"
                      class="h-8 px-3 rounded-lg text-[12px] font-semibold bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
                      @click="confirmDelete(cat.id)"
                    >
                      <Loader2 v-if="deletingId === cat.id" :size="12" class="animate-spin" />
                      <span v-else>Remover</span>
                    </button>
                  </div>
                </div>
              </template>

              <!-- Normal view -->
              <template v-else>
                <div class="flex items-center gap-3 px-4 h-[52px]">
                  <span
                    class="size-8 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ background: (cat.color ?? 'hsl(var(--success))') + '22', color: cat.color ?? 'hsl(var(--success))' }"
                  >
                    <component
                      v-if="cat.icon && findIcon(cat.icon)"
                      :is="findIcon(cat.icon)!.component"
                      :size="15"
                      :stroke-width="1.8"
                    />
                    <span v-else class="text-[13px] font-bold">{{ cat.name.charAt(0) }}</span>
                  </span>

                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-medium text-foreground leading-none">{{ cat.name }}</p>
                  </div>

                  <span
                    v-if="cat.monthly_limit"
                    class="text-[12px] text-muted-foreground shrink-0"
                  >
                    {{ formatCurrency(cat.monthly_limit) }}
                  </span>

                  <button
                    type="button"
                    class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    @click="openEdit(cat)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    type="button"
                    :disabled="deletingId === cat.id"
                    class="size-11 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    @click="requestDelete(cat.id)"
                  >
                    <Loader2 v-if="deletingId === cat.id" :size="14" class="animate-spin" />
                    <Trash2 v-else :size="14" />
                  </button>
                </div>
              </template>
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
  </AppPageContainer>
</template>
