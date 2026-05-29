<script setup lang="ts">
import { ref } from 'vue'
import { AppPageContainer } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { authApi } from '@/services/api/auth'
import { Loader2, CheckSquare, Flame, Target, CalendarDays, FileText, BookOpen, Bookmark, ShoppingCart, Lock, TriangleAlert } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToast()

const resetConfirmOpen = ref(false)
const resetting = ref(false)

async function confirmReset() {
  resetting.value = true
  try {
    await authApi.resetData()
    toast.success('Todos os dados foram apagados. Recarregando…')
    // Full page reload clears all in-memory store state
    setTimeout(() => { window.location.href = '/finance' }, 1200)
  } catch {
    toast.error('Erro ao resetar dados. Tente novamente.')
    resetting.value = false
  }
}

const MODULES = [
  { key: 'tasks',    label: 'Tarefas',    icon: CheckSquare,  description: 'Gerenciador de tarefas e subtarefas' },
  { key: 'habits',   label: 'Hábitos',    icon: Flame,        description: 'Rastreamento de hábitos diários e streaks' },
  { key: 'goals',    label: 'Metas',      icon: Target,       description: 'Metas de curto e longo prazo' },
  { key: 'calendar', label: 'Agenda',     icon: CalendarDays, description: 'Eventos e compromissos' },
  { key: 'notes',    label: 'Notas',      icon: FileText,     description: 'Notas livres com markdown' },
  { key: 'daily_log',label: 'Daily Log',  icon: BookOpen,     description: 'Diário diário de atividades' },
  { key: 'bookmarks',label: 'Bookmarks',  icon: Bookmark,     description: 'Links e favoritos organizados' },
  { key: 'purchases',label: 'Compras',    icon: ShoppingCart, description: 'Lista de compras e desejos' },
  { key: 'vault',    label: 'Cofre',      icon: Lock,         description: 'Senhas e dados sensíveis criptografados' },
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
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="mb-6 pb-3 border-b border-border">
      <p class="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground/60 mb-0.5">
        Sistema
      </p>
      <h1 class="text-[22px] lg:text-[18px] font-semibold leading-tight tracking-tight">
        Configurações
      </h1>
      <p class="text-[12px] text-muted-foreground mt-1">
        Ative ou desative módulos para manter a sidebar limpa.
      </p>
    </div>

    <!-- Módulos -->
    <section>
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-3">
        Módulos
      </h2>
      <p class="text-[12px] text-muted-foreground/70 mb-4">
        Finanças e Dashboard são sempre visíveis.
      </p>
      <div class="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border/60">
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

    <!-- Zona de perigo -->
    <section class="mt-8">
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.1em] text-destructive/70 mb-3">
        Zona de perigo
      </h2>

      <div class="bg-card border border-destructive/20 rounded-xl overflow-hidden">
        <div class="px-4 py-4 flex items-start gap-4">
          <span class="flex items-center justify-center size-8 rounded-lg bg-destructive/10 text-destructive shrink-0 mt-0.5">
            <TriangleAlert :size="15" :stroke-width="1.9" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-foreground">Resetar todos os dados</p>
            <p class="text-[11px] text-muted-foreground/60 mt-0.5 leading-snug">
              Apaga permanentemente todas as transações, contas, cartões, categorias, tarefas, hábitos, metas e demais dados. A conta fica como recém-criada. Esta ação não pode ser desfeita.
            </p>

            <!-- Botão inicial -->
            <button
              v-if="!resetConfirmOpen"
              type="button"
              class="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              @click="resetConfirmOpen = true"
            >
              Resetar dados
            </button>

            <!-- Confirmação inline -->
            <div v-else class="mt-3 flex flex-col gap-2">
              <p class="text-[12px] font-semibold text-destructive">
                Tem certeza? Esta ação é irreversível.
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="h-9 px-4 rounded-lg text-[12px] font-semibold bg-destructive text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                  :disabled="resetting"
                  @click="confirmReset"
                >
                  <Loader2 v-if="resetting" :size="13" class="animate-spin" />
                  <span>{{ resetting ? 'Apagando…' : 'Sim, apagar tudo' }}</span>
                </button>
                <button
                  type="button"
                  class="h-9 px-4 rounded-lg text-[12px] font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
                  :disabled="resetting"
                  @click="resetConfirmOpen = false"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </AppPageContainer>
</template>
