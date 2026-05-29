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
import FinanceSubNav from '@/features/finance/components/FinanceSubNav.vue'
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
          <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/60 mb-0.5">
            Finanças
          </p>
          <h1 class="text-[22px] lg:text-[18px] font-semibold leading-tight tracking-tight">
            Categorias
          </h1>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
          @click="openCreate()"
        >
          <Plus :size="14" :stroke-width="2.5" />
          Nova categoria
        </button>
      </div>

      <FinanceSubNav />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 6" :key="i" class="h-[68px] w-full rounded-2xl" />
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
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              Despesas
              <span class="ml-1.5 text-muted-foreground/30">{{ expenseCategories.length }}</span>
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium text-muted-foreground/50 hover:text-muted-foreground hover:bg-card transition-all"
              @click="openCreate('expense')"
            >
              <Plus :size="11" />
              Adicionar
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="cat in expenseCategories"
              :key="cat.id"
              class="bg-card rounded-2xl border border-white/8 overflow-hidden"
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
                <div class="flex items-center gap-3 px-4 py-3">
                  <!-- Icon -->
                  <span
                    class="flex items-center justify-center size-10 rounded-xl shrink-0"
                    :style="{ background: (cat.color ?? '#ef4444') + '22', color: cat.color ?? '#ef4444' }"
                  >
                    <component
                      v-if="cat.icon && findIcon(cat.icon)"
                      :is="findIcon(cat.icon)!.component"
                      :size="18"
                      :stroke-width="1.8"
                    />
                    <span v-else class="text-[14px] font-bold">{{ cat.name.charAt(0) }}</span>
                  </span>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-medium text-foreground leading-none">{{ cat.name }}</p>
                    <p v-if="cat.monthly_limit" class="text-[11px] text-muted-foreground/50 mt-1">
                      Meta: {{ formatCurrency(cat.monthly_limit) }}/mês
                    </p>
                  </div>

                  <!-- Budget badge -->
                  <span
                    v-if="cat.monthly_limit"
                    class="text-[11px] tabular-nums font-medium px-2 py-0.5 rounded-md border shrink-0"
                    :style="{
                      color: cat.color ?? '#ef4444',
                      borderColor: (cat.color ?? '#ef4444') + '40',
                      background: (cat.color ?? '#ef4444') + '12',
                    }"
                  >
                    {{ formatCurrency(cat.monthly_limit) }}
                  </span>

                  <!-- Actions -->
                  <button
                    type="button"
                    class="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-background transition-all"
                    @click="openEdit(cat)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    type="button"
                    :disabled="deletingId === cat.id"
                    class="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
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
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              Receitas
              <span class="ml-1.5 text-muted-foreground/30">{{ incomeCategories.length }}</span>
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium text-muted-foreground/50 hover:text-muted-foreground hover:bg-card transition-all"
              @click="openCreate('income')"
            >
              <Plus :size="11" />
              Adicionar
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="cat in incomeCategories"
              :key="cat.id"
              class="bg-card rounded-2xl border border-white/8 overflow-hidden"
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
                <div class="flex items-center gap-3 px-4 py-3">
                  <span
                    class="flex items-center justify-center size-10 rounded-xl shrink-0"
                    :style="{ background: (cat.color ?? '#22c55e') + '22', color: cat.color ?? '#22c55e' }"
                  >
                    <component
                      v-if="cat.icon && findIcon(cat.icon)"
                      :is="findIcon(cat.icon)!.component"
                      :size="18"
                      :stroke-width="1.8"
                    />
                    <span v-else class="text-[14px] font-bold">{{ cat.name.charAt(0) }}</span>
                  </span>

                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-medium text-foreground leading-none">{{ cat.name }}</p>
                    <p v-if="cat.monthly_limit" class="text-[11px] text-muted-foreground/50 mt-1">
                      Meta: {{ formatCurrency(cat.monthly_limit) }}/mês
                    </p>
                  </div>

                  <span
                    v-if="cat.monthly_limit"
                    class="text-[11px] tabular-nums font-medium px-2 py-0.5 rounded-md border shrink-0"
                    :style="{
                      color: cat.color ?? '#22c55e',
                      borderColor: (cat.color ?? '#22c55e') + '40',
                      background: (cat.color ?? '#22c55e') + '12',
                    }"
                  >
                    {{ formatCurrency(cat.monthly_limit) }}
                  </span>

                  <button
                    type="button"
                    class="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-background transition-all"
                    @click="openEdit(cat)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    type="button"
                    :disabled="deletingId === cat.id"
                    class="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
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
