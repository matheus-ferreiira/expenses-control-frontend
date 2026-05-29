<script setup lang="ts">
import { ref } from 'vue'
import { AppPageContainer } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { Loader2, CheckSquare, Flame, Target, CalendarDays, FileText, BookOpen, Bookmark, ShoppingCart, Lock } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToast()

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
  </AppPageContainer>
</template>
