<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppPageContainer, PageHeader } from '@/components/shared'
import { Avatar, AvatarFallback } from '@ui/avatar'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useToast } from '@/composables/useToast'
import { authApi } from '@/services/api/auth'
import { Loader2, CheckSquare, Flame, CalendarDays, FileText, Bookmark, ShoppingCart, Lock, TriangleAlert, LogOut, Moon, Sun, Pencil, KeyRound, ChevronDown } from 'lucide-vue-next'

const auth = useAuthStore()
const ui = useUiStore()
const toast = useToast()
const router = useRouter()

// ── Conta ────────────────────────────────────────────────────────────────────
const loggingOut = ref(false)

function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

async function handleLogout() {
  loggingOut.value = true
  try {
    await auth.logout()
    router.push({ name: 'login' })
  } finally {
    loggingOut.value = false
  }
}

// ── Editar nome ──────────────────────────────────────────────────────────────
const editingName = ref(false)
const nameDraft = ref('')
const savingName = ref(false)

function startEditName() {
  nameDraft.value = auth.user?.name ?? ''
  editingName.value = true
}

async function saveName() {
  const name = nameDraft.value.trim()
  if (name.length < 2 || savingName.value) return
  savingName.value = true
  try {
    const updated = await authApi.updateProfile(name)
    auth.user = updated
    toast.success('Nome atualizado')
    editingName.value = false
  } catch {
    toast.error('Erro ao atualizar nome')
  } finally {
    savingName.value = false
  }
}

// ── Trocar senha ─────────────────────────────────────────────────────────────
const passwordOpen = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)

const passwordValid = () =>
  currentPassword.value.length > 0 &&
  newPassword.value.length >= 8 &&
  newPassword.value === confirmPassword.value

async function savePassword() {
  if (!passwordValid() || savingPassword.value) return
  savingPassword.value = true
  try {
    await authApi.updatePassword({
      current_password: currentPassword.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    })
    toast.success('Senha alterada')
    passwordOpen.value = false
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch {
    toast.error('Senha atual incorreta ou nova senha inválida')
  } finally {
    savingPassword.value = false
  }
}

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
  { key: 'calendar', label: 'Agenda',     icon: CalendarDays, description: 'Eventos e compromissos' },
  { key: 'notes',    label: 'Notas',      icon: FileText,     description: 'Notas livres com markdown' },
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
    <PageHeader title="Configurações" subtitle="Conta, módulos e preferências do sistema" />

    <!-- Conta -->
    <section class="mb-8">
      <h2 class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Conta
      </h2>
      <div class="bg-card rounded-xl overflow-hidden">
        <!-- Perfil -->
        <div class="px-4 py-4 flex items-center gap-4 border-b border-border">
          <Avatar class="h-11 w-11 shrink-0">
            <AvatarFallback class="text-[14px] font-semibold bg-muted text-primary">
              {{ initials(auth.user?.name) }}
            </AvatarFallback>
          </Avatar>
          <div class="flex-1 min-w-0">
            <template v-if="!editingName">
              <p class="text-[14px] font-semibold text-foreground truncate">{{ auth.user?.name ?? 'Usuário' }}</p>
              <p class="text-[12px] text-muted-foreground truncate">{{ auth.user?.email ?? '' }}</p>
            </template>
            <div v-else class="flex items-center gap-2">
              <input
                v-model="nameDraft"
                type="text"
                class="flex-1 h-9 rounded-lg bg-muted px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
                placeholder="Seu nome"
                @keydown.enter="saveName"
                @keydown.esc="editingName = false"
              />
              <button
                type="button"
                class="h-9 px-3 rounded-lg text-[12px] font-semibold bg-primary text-primary-foreground disabled:opacity-40"
                :disabled="nameDraft.trim().length < 2 || savingName"
                @click="saveName"
              >
                <Loader2 v-if="savingName" :size="13" class="animate-spin" />
                <span v-else>Salvar</span>
              </button>
            </div>
          </div>
          <button
            v-if="!editingName"
            type="button"
            class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            @click="startEditName"
          >
            <Pencil :size="13" />
            Editar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            <Loader2 v-if="loggingOut" :size="13" class="animate-spin" />
            <LogOut v-else :size="13" />
            Sair
          </button>
        </div>

        <!-- Trocar senha -->
        <div class="px-4 py-3">
          <button
            type="button"
            class="w-full flex items-center gap-3 text-left"
            @click="passwordOpen = !passwordOpen"
          >
            <span class="flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground shrink-0">
              <KeyRound :size="15" :stroke-width="1.9" />
            </span>
            <span class="flex-1">
              <span class="block text-[13px] font-medium text-foreground">Trocar senha</span>
              <span class="block text-[11px] text-muted-foreground">Requer a senha atual</span>
            </span>
            <ChevronDown :size="14" class="text-muted-foreground transition-transform" :class="passwordOpen ? 'rotate-180' : ''" />
          </button>

          <div v-if="passwordOpen" class="mt-3 space-y-2.5">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">Senha atual</p>
              <input
                v-model="currentPassword"
                type="password"
                autocomplete="current-password"
                class="w-full h-10 rounded-lg bg-muted px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">Nova senha (mín. 8)</p>
              <input
                v-model="newPassword"
                type="password"
                autocomplete="new-password"
                class="w-full h-10 rounded-lg bg-muted px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">Confirmar nova senha</p>
              <input
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                class="w-full h-10 rounded-lg bg-muted px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
              />
              <p v-if="confirmPassword && newPassword !== confirmPassword" class="text-[11px] text-destructive mt-1">
                As senhas não coincidem
              </p>
            </div>
            <button
              type="button"
              class="h-10 px-4 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!passwordValid() || savingPassword"
              @click="savePassword"
            >
              <Loader2 v-if="savingPassword" :size="13" class="animate-spin" />
              Alterar senha
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Aparência -->
    <section class="mb-8">
      <h2 class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Aparência
      </h2>
      <div class="bg-card rounded-xl px-4 py-4 flex items-center gap-4">
        <span class="flex items-center justify-center size-8 rounded-lg bg-muted text-primary shrink-0">
          <Moon v-if="ui.theme === 'dark'" :size="15" :stroke-width="1.9" />
          <Sun v-else :size="15" :stroke-width="1.9" />
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-medium text-foreground">Tema</p>
          <p class="text-[11px] text-muted-foreground">O tema escuro é o padrão do VaultOS</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors"
            :class="ui.theme === 'dark'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'"
            @click="ui.theme !== 'dark' && ui.toggleTheme()"
          >
            <Moon :size="12" />
            Escuro
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors"
            :class="ui.theme === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'"
            @click="ui.theme !== 'light' && ui.toggleTheme()"
          >
            <Sun :size="12" />
            Claro
          </button>
        </div>
      </div>
    </section>

    <!-- Módulos -->
    <section>
      <h2 class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Módulos
      </h2>
      <p class="text-[12px] text-muted-foreground mb-4">
        Finanças e Dashboard são sempre visíveis.
      </p>
      <div class="bg-card rounded-xl overflow-hidden divide-y divide-border">
        <div
          v-for="mod in MODULES"
          :key="mod.key"
          class="flex items-center gap-4 px-4 py-3"
        >
          <span
            class="flex items-center justify-center size-8 rounded-lg shrink-0"
            :class="auth.moduleEnabled(mod.key) ? 'bg-muted text-primary' : 'bg-muted text-muted-foreground'"
          >
            <component :is="mod.icon" :size="15" :stroke-width="1.9" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-foreground">{{ mod.label }}</p>
            <p class="text-[11px] text-muted-foreground truncate">{{ mod.description }}</p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
            :class="auth.moduleEnabled(mod.key) ? 'bg-primary' : 'bg-muted'"
            :disabled="savingModule === mod.key"
            @click="toggleModule(mod.key)"
          >
            <span
              class="inline-block size-4 transform rounded-full bg-background  transition-transform"
              :class="auth.moduleEnabled(mod.key) ? 'translate-x-6' : 'translate-x-1'"
            />
            <Loader2 v-if="savingModule === mod.key" :size="10" class="absolute right-1 animate-spin text-background" />
          </button>
        </div>
      </div>
    </section>

    <!-- Zona de perigo -->
    <section class="mt-8">
      <h2 class="text-[11px] font-semibold uppercase tracking-widest text-destructive mb-3">
        Zona de perigo
      </h2>

      <div class="bg-card rounded-xl overflow-hidden">
        <div class="px-4 py-4 flex items-start gap-4">
          <span class="flex items-center justify-center size-8 rounded-lg bg-muted text-destructive shrink-0 mt-0.5">
            <TriangleAlert :size="15" :stroke-width="1.9" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-foreground">Resetar todos os dados</p>
            <p class="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Apaga permanentemente todas as transações, contas, cartões, categorias, tarefas, hábitos, metas e demais dados. A conta fica como recém-criada. Esta ação não pode ser desfeita.
            </p>

            <!-- Botão inicial -->
            <button
              v-if="!resetConfirmOpen"
              type="button"
              class="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-destructive hover:bg-muted transition-colors"
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
                  class="h-9 px-4 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors"
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
