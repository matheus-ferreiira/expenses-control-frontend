<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AppPageContainer } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { financeApi } from '@/services/api/finance'
import { Skeleton } from '@ui/skeleton'
import {
  Plus, Pencil, Trash2, Loader2,
  CheckSquare, Flame, Target, CalendarDays, FileText, BookOpen, Bookmark, ShoppingCart, Lock,
} from 'lucide-vue-next'
import { findIcon } from '@/lib/icons'
import CategoryColorPicker from '@/features/finance/components/CategoryColorPicker.vue'
import CategoryIconPicker from '@/features/finance/components/CategoryIconPicker.vue'
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
    const enabled = current[key] !== false
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
const newCatColor = ref('#8b5cf6')
const newCatIcon = ref('')
const showAddForm = ref(false)

const editingCatId = ref<string | null>(null)
const editCatName = ref('')
const editCatColor = ref('')
const editCatIcon = ref('')

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
      icon: newCatIcon.value || null,
      monthly_limit: null,
      is_default: false,
    })
    newCatName.value = ''
    newCatIcon.value = ''
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
  editCatIcon.value = cat.icon ?? ''
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
      icon: editCatIcon.value || null,
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

const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'))
const incomeCategories = computed(() => categories.value.filter((c) => c.type === 'income'))

function openAddForm() {
  showAddForm.value = true
  showNewIconPicker.value = false
  newCatName.value = ''
  newCatIcon.value = ''
  newCatColor.value = '#8b5cf6'
  newCatType.value = 'expense'
  iconSearch.value = ''
}
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
              class="flex items-center justify-center size-8 rounded-lg shrink-0"
              :class="auth.moduleEnabled(mod.key) ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-muted-foreground'"
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
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              Categorias de transação
            </h2>
            <p class="text-[12px] text-muted-foreground/60 mt-0.5">
              Personalize com nome, cor e ícone.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
            @click="openAddForm"
          >
            <Plus :size="13" />
            Nova categoria
          </button>
        </div>

        <!-- ── Add form ─────────────────────────────────────────────────── -->
        <Transition name="slide-down">
          <div v-if="showAddForm" class="bg-card border border-border rounded-xl p-4 mb-4 space-y-4">
            <!-- Row: nome + tipo -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Nome</p>
                <input
                  v-model="newCatName"
                  placeholder="Ex: Restaurante"
                  class="w-full h-9 px-3 rounded-lg bg-muted border border-border/60 text-sm outline-none focus:border-border transition-colors"
                  @keydown.enter="addCategory"
                />
              </div>
              <div>
                <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Tipo</p>
                <div class="grid grid-cols-2 gap-1 p-0.5 bg-muted rounded-lg">
                  <button
                    type="button"
                    class="h-8 rounded-md text-[12px] font-medium transition-all"
                    :class="newCatType === 'expense' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground'"
                    @click="newCatType = 'expense'"
                  >Despesa</button>
                  <button
                    type="button"
                    class="h-8 rounded-md text-[12px] font-medium transition-all"
                    :class="newCatType === 'income' ? 'bg-success/20 text-success' : 'text-muted-foreground'"
                    @click="newCatType = 'income'"
                  >Receita</button>
                </div>
              </div>
            </div>

            <!-- Cor -->
            <div>
              <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Cor</p>
              <CategoryColorPicker v-model="newCatColor" />
            </div>

            <!-- Ícone -->
            <div>
              <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Ícone</p>
              <CategoryIconPicker v-model="newCatIcon" :color="newCatColor" />
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-1">
              <button
                type="button"
                class="flex-1 h-9 rounded-lg border border-border text-[12px] text-muted-foreground hover:bg-muted transition-colors"
                @click="showAddForm = false; showNewIconPicker = false"
              >Cancelar</button>
              <button
                type="button"
                :disabled="savingCat || !newCatName.trim()"
                class="flex-1 h-9 rounded-lg bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                @click="addCategory"
              >
                <Loader2 v-if="savingCat" :size="12" class="animate-spin inline mr-1" />
                Criar categoria
              </button>
            </div>
          </div>
        </Transition>

        <!-- ── Category lists ────────────────────────────────────────────── -->
        <div v-if="loadingCats" class="space-y-2">
          <Skeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-xl" />
        </div>

        <div v-else class="space-y-5">

          <!-- Expenses -->
          <div v-if="expenseCategories.length > 0">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-2">Despesas</p>
            <div class="space-y-2">
              <div
                v-for="cat in expenseCategories"
                :key="cat.id"
                class="bg-card border border-border rounded-xl overflow-hidden"
              >
                <!-- Edit mode -->
                <template v-if="editingCatId === cat.id">
                  <div class="p-4 space-y-3">
                    <!-- Name -->
                    <div>
                      <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Nome</p>
                      <input
                        v-model="editCatName"
                        class="w-full h-9 px-3 rounded-lg bg-muted border border-border/60 text-sm outline-none focus:border-border transition-colors"
                        @keydown.enter="saveEdit(cat)"
                        @keydown.escape="cancelEdit"
                      />
                    </div>
                    <!-- Color -->
                    <div>
                      <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Cor</p>
                      <CategoryColorPicker v-model="editCatColor" />
                    </div>
                    <!-- Icon -->
                    <div>
                      <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Ícone</p>
                      <CategoryIconPicker v-model="editCatIcon" :color="editCatColor" />
                    </div>
                    <!-- Actions -->
                    <div class="flex gap-2 pt-1">
                      <button type="button" class="flex-1 h-8 rounded-lg border border-border text-[12px] text-muted-foreground hover:bg-muted transition-colors" @click="cancelEdit">
                        Cancelar
                      </button>
                      <button
                        type="button"
                        :disabled="savingCat"
                        class="flex-1 h-8 rounded-lg bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                        @click="saveEdit(cat)"
                      >
                        <Loader2 v-if="savingCat" :size="12" class="animate-spin inline mr-1" />
                        Salvar
                      </button>
                    </div>
                  </div>
                </template>

                <!-- View mode -->
                <template v-else>
                  <div class="flex items-center gap-3 px-4 py-3">
                    <!-- Icon swatch -->
                    <span
                      class="flex items-center justify-center size-10 rounded-xl shrink-0"
                      :style="{ background: (cat.color ?? '#6b7280') + '22', color: cat.color ?? '#6b7280' }"
                    >
                      <component
                        v-if="cat.icon && findIcon(cat.icon)"
                        :is="findIcon(cat.icon)!.component"
                        :size="18"
                        :stroke-width="1.8"
                      />
                      <span v-else class="text-[13px] font-bold">{{ cat.name.charAt(0) }}</span>
                    </span>
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-[13px] font-medium text-foreground">{{ cat.name }}</p>
                      <p v-if="cat.icon && findIcon(cat.icon)" class="text-[11px] text-muted-foreground/50 mt-0.5">
                        {{ findIcon(cat.icon)!.label }}
                      </p>
                      <p v-else class="text-[11px] text-muted-foreground/50 mt-0.5 italic">Sem ícone</p>
                    </div>
                    <!-- Color dot -->
                    <span
                      class="size-2.5 rounded-full shrink-0"
                      :style="{ background: cat.color ?? '#6b7280' }"
                    />
                    <!-- Actions -->
                    <button
                      type="button"
                      class="size-8 grid place-items-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all"
                      @click="startEdit(cat)"
                    >
                      <Pencil :size="13" />
                    </button>
                    <button
                      type="button"
                      :disabled="deletingCat === cat.id"
                      class="size-8 grid place-items-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                      @click="deleteCategory(cat.id)"
                    >
                      <Loader2 v-if="deletingCat === cat.id" :size="13" class="animate-spin" />
                      <Trash2 v-else :size="13" />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div v-else-if="!loadingCats" class="text-[12px] text-muted-foreground/50 py-2">
            Nenhuma categoria de despesa.
          </div>

          <!-- Incomes -->
          <div v-if="incomeCategories.length > 0">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-2">Receitas</p>
            <div class="space-y-2">
              <div
                v-for="cat in incomeCategories"
                :key="cat.id"
                class="bg-card border border-border rounded-xl overflow-hidden"
              >
                <!-- Edit mode -->
                <template v-if="editingCatId === cat.id">
                  <div class="p-4 space-y-3">
                    <div>
                      <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Nome</p>
                      <input
                        v-model="editCatName"
                        class="w-full h-9 px-3 rounded-lg bg-muted border border-border/60 text-sm outline-none focus:border-border transition-colors"
                        @keydown.enter="saveEdit(cat)"
                        @keydown.escape="cancelEdit"
                      />
                    </div>
                    <div>
                      <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Cor</p>
                      <div class="flex items-center gap-2 flex-wrap">
                        <button
                          v-for="c in PRESET_COLORS"
                          :key="c"
                          type="button"
                          class="size-7 rounded-full transition-all hover:scale-110"
                          :style="{
                            background: c,
                            outline: editCatColor === c ? `2px solid ${c}` : 'none',
                            outlineOffset: '2px',
                          }"
                          @click="editCatColor = c"
                        />
                      </div>
                    </div>
                    <div>
                      <p class="text-[10px] text-muted-foreground/70 mb-1.5 font-medium">Ícone</p>
                      <button
                        type="button"
                        class="flex items-center gap-2.5 h-9 px-3 rounded-lg border border-border/60 bg-muted text-sm hover:border-border transition-colors w-full text-left"
                        @click="showEditIconPicker = !showEditIconPicker"
                      >
                        <span
                          class="flex items-center justify-center size-6 rounded-md shrink-0"
                          :style="editCatIcon ? { background: editCatColor + '30', color: editCatColor } : {}"
                        >
                          <component
                            v-if="editCatIcon && findIcon(editCatIcon)"
                            :is="findIcon(editCatIcon)!.component"
                            :size="14"
                          />
                          <span v-else class="text-muted-foreground/40 text-[10px]">—</span>
                        </span>
                        <span class="flex-1 text-[13px]" :class="editCatIcon ? 'text-foreground' : 'text-muted-foreground'">
                          {{ editCatIcon && findIcon(editCatIcon) ? findIcon(editCatIcon)!.label : 'Escolher ícone' }}
                        </span>
                        <span class="text-muted-foreground/40 text-[11px]">{{ showEditIconPicker ? '▲' : '▼' }}</span>
                      </button>
                      <div v-if="showEditIconPicker" class="mt-2 border border-border/60 rounded-xl bg-muted/30 overflow-hidden">
                        <div class="flex items-center gap-2 px-3 py-2 border-b border-border/40">
                          <Search :size="13" class="text-muted-foreground shrink-0" />
                          <input
                            v-model="iconSearch"
                            placeholder="Buscar ícone..."
                            class="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/50"
                          />
                          <button v-if="editCatIcon" type="button" class="text-muted-foreground/50 hover:text-foreground" @click="editCatIcon = ''">
                            <X :size="12" />
                          </button>
                        </div>
                        <div class="max-h-48 overflow-y-auto p-2 space-y-3">
                          <div v-for="iconCat in filteredIconCategories" :key="iconCat.id">
                            <p class="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold px-1 mb-1">{{ iconCat.label }}</p>
                            <div class="grid grid-cols-8 gap-1">
                              <button
                                v-for="icon in iconCat.icons"
                                :key="icon.name"
                                type="button"
                                :title="icon.label"
                                class="flex items-center justify-center size-8 rounded-lg transition-all hover:scale-110"
                                :style="editCatIcon === icon.name
                                  ? { background: editCatColor + '30', color: editCatColor, outline: `1.5px solid ${editCatColor}` }
                                  : {}"
                                :class="editCatIcon !== icon.name ? 'hover:bg-muted text-muted-foreground' : ''"
                                @click="editCatIcon = icon.name; showEditIconPicker = false; iconSearch = ''"
                              >
                                <component :is="icon.component" :size="15" />
                              </button>
                            </div>
                          </div>
                          <div v-if="filteredIconCategories.length === 0" class="py-4 text-center text-[12px] text-muted-foreground/50">
                            Nenhum ícone encontrado
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-2 pt-1">
                      <button type="button" class="flex-1 h-8 rounded-lg border border-border text-[12px] text-muted-foreground hover:bg-muted transition-colors" @click="cancelEdit">
                        Cancelar
                      </button>
                      <button
                        type="button"
                        :disabled="savingCat"
                        class="flex-1 h-8 rounded-lg bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                        @click="saveEdit(cat)"
                      >
                        <Loader2 v-if="savingCat" :size="12" class="animate-spin inline mr-1" />
                        Salvar
                      </button>
                    </div>
                  </div>
                </template>

                <!-- View mode -->
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
                      <span v-else class="text-[13px] font-bold">{{ cat.name.charAt(0) }}</span>
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-[13px] font-medium text-foreground">{{ cat.name }}</p>
                      <p v-if="cat.icon && findIcon(cat.icon)" class="text-[11px] text-muted-foreground/50 mt-0.5">
                        {{ findIcon(cat.icon)!.label }}
                      </p>
                      <p v-else class="text-[11px] text-muted-foreground/50 mt-0.5 italic">Sem ícone</p>
                    </div>
                    <span
                      class="size-2.5 rounded-full shrink-0"
                      :style="{ background: cat.color ?? '#22c55e' }"
                    />
                    <button
                      type="button"
                      class="size-8 grid place-items-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all"
                      @click="startEdit(cat)"
                    >
                      <Pencil :size="13" />
                    </button>
                    <button
                      type="button"
                      :disabled="deletingCat === cat.id"
                      class="size-8 grid place-items-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                      @click="deleteCategory(cat.id)"
                    >
                      <Loader2 v-if="deletingCat === cat.id" :size="13" class="animate-spin" />
                      <Trash2 v-else :size="13" />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  </AppPageContainer>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-4px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
