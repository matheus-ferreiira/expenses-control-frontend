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
          style="display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); color: #F0F0F0; flex-shrink: 0; cursor: pointer;"
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
          <div style="background: #111111; border-radius: 8px; overflow: hidden">
            <div class="flex items-center justify-between" style="padding: 16px 16px 8px">
              <p style="font-size: 11px; color: #888888; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em">
                DESPESAS
              </p>
              <button
                type="button"
                style="font-size: 12px; color: #888888; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0"
                @click="openCreate('expense')"
              >
                + Adicionar
              </button>
            </div>
            <div
              v-for="cat in expenseCategories"
              :key="cat.id"
              style="border-top: 1px solid rgba(255,255,255,0.05)"
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
                <div class="flex items-center gap-3 px-4" style="height: 52px">
                  <span
                    class="flex items-center justify-center shrink-0"
                    style="width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0"
                    :style="{ background: (cat.color ?? '#ef4444') + '22', color: cat.color ?? '#ef4444' }"
                  >
                    <component
                      v-if="cat.icon && findIcon(cat.icon)"
                      :is="findIcon(cat.icon)!.component"
                      :size="15"
                      :stroke-width="1.8"
                    />
                    <span v-else style="font-size: 13px; font-weight: 700">{{ cat.name.charAt(0) }}</span>
                  </span>

                  <div class="flex-1 min-w-0">
                    <p style="font-size: 14px; font-weight: 500; color: #F0F0F0; line-height: 1">{{ cat.name }}</p>
                  </div>

                  <span
                    v-if="cat.monthly_limit"
                    style="font-size: 12px; color: #888888; flex-shrink: 0"
                  >
                    {{ formatCurrency(cat.monthly_limit) }}
                  </span>

                  <button
                    type="button"
                    style="min-height: 44px; min-width: 44px; display: grid; place-items: center; color: #888888; background: none; border: none; cursor: pointer; border-radius: 8px"
                    @click="openEdit(cat)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    type="button"
                    :disabled="deletingId === cat.id"
                    style="min-height: 44px; min-width: 44px; display: grid; place-items: center; color: #888888; background: none; border: none; cursor: pointer; border-radius: 8px"
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
          <div style="background: #111111; border-radius: 8px; overflow: hidden">
            <div class="flex items-center justify-between" style="padding: 16px 16px 8px">
              <p style="font-size: 11px; color: #888888; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em">
                RECEITAS
              </p>
              <button
                type="button"
                style="font-size: 12px; color: #888888; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0"
                @click="openCreate('income')"
              >
                + Adicionar
              </button>
            </div>
            <div
              v-for="cat in incomeCategories"
              :key="cat.id"
              style="border-top: 1px solid rgba(255,255,255,0.05)"
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
                <div class="flex items-center gap-3 px-4" style="height: 52px">
                  <span
                    class="flex items-center justify-center shrink-0"
                    style="width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0"
                    :style="{ background: (cat.color ?? '#22c55e') + '22', color: cat.color ?? '#22c55e' }"
                  >
                    <component
                      v-if="cat.icon && findIcon(cat.icon)"
                      :is="findIcon(cat.icon)!.component"
                      :size="15"
                      :stroke-width="1.8"
                    />
                    <span v-else style="font-size: 13px; font-weight: 700">{{ cat.name.charAt(0) }}</span>
                  </span>

                  <div class="flex-1 min-w-0">
                    <p style="font-size: 14px; font-weight: 500; color: #F0F0F0; line-height: 1">{{ cat.name }}</p>
                  </div>

                  <span
                    v-if="cat.monthly_limit"
                    style="font-size: 12px; color: #888888; flex-shrink: 0"
                  >
                    {{ formatCurrency(cat.monthly_limit) }}
                  </span>

                  <button
                    type="button"
                    style="min-height: 44px; min-width: 44px; display: grid; place-items: center; color: #888888; background: none; border: none; cursor: pointer; border-radius: 8px"
                    @click="openEdit(cat)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    type="button"
                    :disabled="deletingId === cat.id"
                    style="min-height: 44px; min-width: 44px; display: grid; place-items: center; color: #888888; background: none; border: none; cursor: pointer; border-radius: 8px"
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
