<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AppPageContainer } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { financeApi } from '@/services/api/finance'
import { Skeleton } from '@ui/skeleton'
import {
  Plus, Pencil, Trash2, Check, X, Loader2,
  CheckSquare, Flame, Target, CalendarDays, FileText, BookOpen, Bookmark, ShoppingCart, Lock,
} from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import type { TransactionCategory } from '@/types/finance'

const auth = useAuthStore()
const financeStore = useFinanceStore()
const toast = useToast()

// ── Module toggles ───────────────────────────────────────────────────────────
const MODULES = [
  { key: 'tasks', label: 'Tarefas', icon: CheckSquare, description: 'Gerenciador de tarefas e subtarefas' },
  { key: 'habits', label: 'Hábitos', icon: Flame, description: 'Rastreamento de hábitos diários e streaks' },
  { key: 'goals', label: 'Metas', icon: Target, description: 'Metas de curto e longo prazo' },
  { key: 'calendar', label: 'Agenda', icon: CalendarDays, description: 'Eventos e compromissos' },
  { key: 'notes', label: 'Notas', icon: FileText, description: 'Notas livres com markdown' },
  { key: 'daily_log', label: 'Daily Log', icon: BookOpen, description: 'Diário diário de atividades' },
  { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark, description: 'Links e favoritos organizados' },
  { key: 'purchases', label: 'Compras', icon: ShoppingCart, description: 'Lista de compras e desejos' },
  { key: 'vault', label: 'Cofre', icon: Lock, description: 'Senhas e dados sensíveis criptografados' },
]

const savingModule = ref<string | null>(null)

async function toggleModule(key: string) {
  savingModule.value = key
  try {
    const current = (auth.user?.settings as { modules?: Record<string, boolean> })?.modules ?? {}
    const enabled = current[key] !== false // default true
    await auth.updateSettings({ modules: { ...current, [key]: !enabled } })
    toast.success(`Módulo ${!enabled ? 'ativado' : 'desativado'}`)
  } catch {
    toast.error('Erro ao salvar configuração')
  } finally {
    savingModule.value = null
  }
}

// ── Categories ───────────────────────────────────────────────────────────────
const loadingCats = ref(false)
const savingCat = ref(false)
const deletingCat = ref<string | null>(null)

const newCatName = ref('')
const newCatType = ref<'expense' | 'income'>('expense')
const newCatColor = ref('#6b7280')
const showAddForm = ref(false)

const editingCatId = ref<string | null>(null)
const editCatName = ref('')
const editCatColor = ref('')

const categories = computed(() => financeStore.categories)

onMounted(async () => {
  loadingCats.value = true
  try {
    await financeStore.fetchAll()
  } finally {
    loadingCats.value = false
  }
})

async function addCategory() {
  if (!newCatName.value.trim()) return
  savingCat.value = true
  try {
    await financeStore.createCategory({
      name: newCatName.value.trim(),
      type: newCatType.value,
      color: newCatColor.value,
      icon: null,
      monthly_limit: null,
    })
    newCatName.value = ''
    showAddForm.value = false
    toast.success('Categoria criada')
  } catch {
    toast.error('Erro ao criar categoria')
  } finally {
    savingCat.value = false
  }
}

function startEdit(cat: TransactionCategory) {
  editingCatId.value = cat.id
  editCatName.value = cat.name
  editCatColor.value = cat.color ?? '#6b7280'
}

function cancelEdit() {
  editingCatId.value = null
}

async function saveEdit(cat: TransactionCategory) {
  savingCat.value = true
  try {
    await financeStore.updateCategory(cat.id, {
      name: editCatName.value.trim(),
      color: editCatColor.value,
    })
    editingCatId.value = null
    toast.success('Categoria atualizada')
  } catch {
    toast.error('Erro ao atualizar categoria')
  } finally {
    savingCat.value = false
  }
}

async function deleteCategory(id: string) {
  deletingCat.value = id
  try {
    await financeApi.categories.delete(id)
    financeStore.categories = financeStore.categories.filter((c) => c.id !== id)
    toast.success('Categoria removida')
  } catch {
    toast.error('Erro ao remover categoria')
  } finally {
    deletingCat.value = null
  }
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#0ea5e9',
]

const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'))
const incomeCategories = computed(() => categories.value.filter((c) => c.type === 'income'))
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="mb-6 pb-3 border-b border-border">
      <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/80 mb-0.5">
        Sistema
      </p>
      <h1 class="text-[22px] lg:text-[18px] font-semibold leading-tight tracking-tight text-foreground">
        Configurações
      </h1>
      <p class="text-[12px] text-muted-foreground mt-1">
        Gerencie módulos, categorias e preferências da sua conta.
      </p>
    </div>

    <div class="space-y-8">

      <!-- ── Módulos ─────────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-3">
          Módulos
        </h2>
        <p class="text-[12px] text-muted-foreground/70 mb-4">
          Desative módulos que você não usa para manter a sidebar limpa. Finanças e Dashboard são sempre visíveis.
        </p>
        <div class="bg-card border border-border rounded-md overflow-hidden divide-y divide-border">
          <div
            v-for="mod in MODULES"
            :key="mod.key"
            class="flex items-center gap-4 px-4 py-3"
          >
            <span
              class="flex items-center justify-center size-8 rounded-lg shrink-0 text-muted-foreground"
              :class="auth.moduleEnabled(mod.key) ? 'bg-primary/10 text-primary' : 'bg-muted/40'"
            >
              <component :is="mod.icon" :size="15" :stroke-width="1.9" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-medium text-foreground">{{ mod.label }}</p>
              <p class="text-[11px] text-muted-foreground/60 truncate">{{ mod.description }}</p>
            </div>
            <button
              type="button"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
              :class="auth.moduleEnabled(mod.key) ? 'bg-primary' : 'bg-muted'"
              :disabled="savingModule === mod.key"
              @click="toggleModule(mod.key)"
            >
              <span
                class="inline-block size-4 transform rounded-full bg-background shadow-sm transition-transform"
                :class="auth.moduleEnabled(mod.key) ? 'translate-x-6' : 'translate-x-1'"
              />
              <Loader2 v-if="savingModule === mod.key" :size="10" class="absolute right-1 animate-spin text-background" />
            </button>
          </div>
        </div>
      </section>

      <!-- ── Categorias de transação ────────────────────────────────────── -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              Categorias de transação
            </h2>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
            @click="showAddForm = !showAddForm"
          >
            <Plus :size="12" />
            Nova categoria
          </button>
        </div>

        <!-- Add form -->
        <div v-if="showAddForm" class="bg-card border border-border rounded-md p-4 mb-3 space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-[10px] text-muted-foreground/70 mb-1">Nome</p>
              <input
                v-model="newCatName"
                placeholder="Ex: Restaurante"
                class="w-full h-8 px-3 rounded-md bg-muted border border-border/60 text-sm outline-none focus:border-border transition-colors"
                @keydown.enter="addCategory"
              />
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground/70 mb-1">Tipo</p>
              <div class="grid grid-cols-2 gap-1 p-0.5 bg-muted rounded-md">
                <button
                  type="button"
                  class="h-7 rounded text-[11px] font-medium transition-all"
                  :class="newCatType === 'expense' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground'"
                  @click="newCatType = 'expense'"
                >Despesa</button>
                <button
                  type="button"
                  class="h-7 rounded text-[11px] font-medium transition-all"
                  :class="newCatType === 'income' ? 'bg-success/20 text-success' : 'text-muted-foreground'"
                  @click="newCatType = 'income'"
                >Receita</button>
              </div>
            </div>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground/70 mb-1">Cor</p>
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="c in PRESET_COLORS"
                :key="c"
                type="button"
                class="size-6 rounded-full transition-transform hover:scale-110"
                :style="{ background: c, outline: newCatColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }"
                @click="newCatColor = c"
              />
            </div>
          </div>
          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="flex-1 h-8 rounded-md border border-border text-[12px] text-muted-foreground hover:bg-muted transition-colors"
              @click="showAddForm = false"
            >Cancelar</button>
            <button
              type="button"
              :disabled="savingCat || !newCatName.trim()"
              class="flex-1 h-8 rounded-md bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              @click="addCategory"
            >
              <Loader2 v-if="savingCat" :size="12" class="animate-spin inline mr-1" />
              Criar
            </button>
          </div>
        </div>

        <!-- Expense categories -->
        <div class="space-y-2">
          <p v-if="expenseCategories.length > 0 || incomeCategories.length > 0" class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-1">
            Despesas
          </p>
          <div v-if="loadingCats" class="space-y-2">
            <Skeleton v-for="i in 3" :key="i" class="h-11 w-full rounded-md" />
          </div>
          <div v-else-if="expenseCategories.length === 0 && !loadingCats" class="text-[12px] text-muted-foreground/50 py-2">
            Nenhuma categoria de despesa.
          </div>
          <div v-else class="bg-card border border-border rounded-md overflow-hidden divide-y divide-border">
            <div
              v-for="cat in expenseCategories"
              :key="cat.id"
              class="flex items-center gap-3 px-3 py-2.5"
            >
              <template v-if="editingCatId === cat.id">
                <input
                  v-model="editCatColor"
                  type="color"
                  class="size-6 rounded cursor-pointer border-none bg-transparent"
                />
                <input
                  v-model="editCatName"
                  class="flex-1 h-7 px-2 rounded bg-muted text-sm outline-none border border-border/60 focus:border-border"
                  @keydown.enter="saveEdit(cat)"
                  @keydown.escape="cancelEdit"
                />
                <button type="button" class="text-success hover:text-success/80 p-1" @click="saveEdit(cat)">
                  <Check :size="14" />
                </button>
                <button type="button" class="text-muted-foreground hover:text-foreground p-1" @click="cancelEdit">
                  <X :size="14" />
                </button>
              </template>
              <template v-else>
                <span
                  class="size-7 rounded-lg grid place-items-center shrink-0"
                  :style="{ background: (cat.color ?? '#6b7280') + '22', color: cat.color ?? '#6b7280' }"
                >
                  <component
                    v-if="cat.icon && findIcon(cat.icon)"
                    :is="findIcon(cat.icon)!.component"
                    :size="14"
                    :stroke-width="1.9"
                  />
                  <span v-else class="text-[10px] font-bold">{{ cat.name.charAt(0) }}</span>
                </span>
                <span class="flex-1 text-[13px] text-foreground">{{ cat.name }}</span>
                <button type="button" class="text-muted-foreground/50 hover:text-foreground p-1 transition-colors" @click="startEdit(cat)">
                  <Pencil :size="12" />
                </button>
                <button
                  type="button"
                  :disabled="deletingCat === cat.id"
                  class="text-muted-foreground/50 hover:text-destructive p-1 transition-colors"
                  @click="deleteCategory(cat.id)"
                >
                  <Loader2 v-if="deletingCat === cat.id" :size="12" class="animate-spin" />
                  <Trash2 v-else :size="12" />
                </button>
              </template>
            </div>
          </div>

          <!-- Income categories -->
          <p v-if="incomeCategories.length > 0" class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mt-4 mb-1">
            Receitas
          </p>
          <div v-if="incomeCategories.length > 0" class="bg-card border border-border rounded-md overflow-hidden divide-y divide-border">
            <div
              v-for="cat in incomeCategories"
              :key="cat.id"
              class="flex items-center gap-3 px-3 py-2.5"
            >
              <template v-if="editingCatId === cat.id">
                <input
                  v-model="editCatColor"
                  type="color"
                  class="size-6 rounded cursor-pointer border-none bg-transparent"
                />
                <input
                  v-model="editCatName"
                  class="flex-1 h-7 px-2 rounded bg-muted text-sm outline-none border border-border/60 focus:border-border"
                  @keydown.enter="saveEdit(cat)"
                  @keydown.escape="cancelEdit"
                />
                <button type="button" class="text-success hover:text-success/80 p-1" @click="saveEdit(cat)">
                  <Check :size="14" />
                </button>
                <button type="button" class="text-muted-foreground hover:text-foreground p-1" @click="cancelEdit">
                  <X :size="14" />
                </button>
              </template>
              <template v-else>
                <span
                  class="size-7 rounded-lg grid place-items-center shrink-0"
                  :style="{ background: (cat.color ?? '#22c55e') + '22', color: cat.color ?? '#22c55e' }"
                >
                  <component
                    v-if="cat.icon && findIcon(cat.icon)"
                    :is="findIcon(cat.icon)!.component"
                    :size="14"
                    :stroke-width="1.9"
                  />
                  <span v-else class="text-[10px] font-bold">{{ cat.name.charAt(0) }}</span>
                </span>
                <span class="flex-1 text-[13px] text-foreground">{{ cat.name }}</span>
                <button type="button" class="text-muted-foreground/50 hover:text-foreground p-1 transition-colors" @click="startEdit(cat)">
                  <Pencil :size="12" />
                </button>
                <button
                  type="button"
                  :disabled="deletingCat === cat.id"
                  class="text-muted-foreground/50 hover:text-destructive p-1 transition-colors"
                  @click="deleteCategory(cat.id)"
                >
                  <Loader2 v-if="deletingCat === cat.id" :size="12" class="animate-spin" />
                  <Trash2 v-else :size="12" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </section>

    </div>
  </AppPageContainer>
</template>
