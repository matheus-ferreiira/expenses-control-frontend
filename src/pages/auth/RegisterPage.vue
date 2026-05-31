<script setup lang="ts">
import { onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import { PasswordField } from '@/features/auth/components'
import { useRegisterForm } from '@/features/auth/composables/useRegisterForm'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const router = useRouter()
const auth = useAuthStore()
const { form, errors, validate } = useRegisterForm()

onMounted(() => nextTick(() => (document.getElementById('name') as HTMLInputElement)?.focus()))

// Password strength: 0–4
const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => {
  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  return labels[passwordStrength.value] ?? ''
})

const strengthColor = computed(() => {
  const colors = ['', 'bg-destructive/70', 'bg-warning/80', 'bg-success/60', 'bg-success']
  return colors[passwordStrength.value] ?? ''
})

async function handleRegister() {
  if (!validate()) return
  auth.error = null
  try {
    await auth.register({
      name: form.name,
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })
    router.push({ name: ROUTES.DASHBOARD })
  } catch {
    // error set by store
  }
}
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-xl font-semibold tracking-tight text-foreground">
        Criar conta
      </h1>
      <p class="text-[13px] text-muted-foreground/60">
        Comece a organizar sua vida pessoal
      </p>
    </div>

    <!-- OAuth buttons -->
    <a
      :href="`${apiUrl}/api/v1/auth/google/redirect`"
      class="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" class="shrink-0">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continuar com Google
    </a>

    <!-- Divider -->
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-border/60" />
      <span class="text-[11px] text-muted-foreground/40 select-none">ou continue com email</span>
      <div class="h-px flex-1 bg-border/60" />
    </div>

    <!-- Form -->
    <form class="space-y-4" novalidate @submit.prevent="handleRegister">

      <!-- Name -->
      <div class="space-y-1.5">
        <label for="name" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          Nome
        </label>
        <Input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Seu nome"
          autocomplete="name"
          :disabled="auth.loading"
          :class="['h-10 transition-base', errors.name ? 'border-destructive/60 focus-visible:ring-destructive/30' : '']"
          @input="errors.name = undefined"
        />
        <p v-if="errors.name" class="text-[11px] text-destructive/80">{{ errors.name }}</p>
      </div>

      <!-- Email -->
      <div class="space-y-1.5">
        <label for="email" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          Email
        </label>
        <Input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="voce@exemplo.com"
          autocomplete="email"
          :disabled="auth.loading"
          :class="['h-10 transition-base', errors.email ? 'border-destructive/60 focus-visible:ring-destructive/30' : '']"
          @input="errors.email = undefined"
        />
        <p v-if="errors.email" class="text-[11px] text-destructive/80">{{ errors.email }}</p>
      </div>

      <!-- Password + strength -->
      <div class="space-y-1.5">
        <label for="password" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          Senha
        </label>
        <PasswordField
          id="password"
          v-model="form.password"
          placeholder="Mínimo 8 caracteres"
          autocomplete="new-password"
          :disabled="auth.loading"
          :error="!!errors.password"
          @update:model-value="errors.password = undefined"
        />
        <!-- Strength bars -->
        <div v-if="form.password" class="flex items-center gap-2 pt-0.5">
          <div class="flex gap-1 flex-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-0.5 flex-1 rounded-full transition-all duration-300"
              :class="i <= passwordStrength ? strengthColor : 'bg-muted-foreground/15'"
            />
          </div>
          <span class="text-[10px] text-muted-foreground/50 shrink-0">{{ strengthLabel }}</span>
        </div>
        <p v-if="errors.password" class="text-[11px] text-destructive/80">{{ errors.password }}</p>
      </div>

      <!-- Confirm password -->
      <div class="space-y-1.5">
        <label for="password_confirmation" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          Confirmar senha
        </label>
        <PasswordField
          id="password_confirmation"
          v-model="form.password_confirmation"
          placeholder="••••••••"
          autocomplete="new-password"
          :disabled="auth.loading"
          :error="!!errors.password_confirmation"
          @update:model-value="errors.password_confirmation = undefined"
        />
        <p v-if="errors.password_confirmation" class="text-[11px] text-destructive/80">{{ errors.password_confirmation }}</p>
      </div>

      <!-- Backend error -->
      <div
        v-if="auth.error"
        class="rounded-md border border-destructive/20 bg-destructive/[0.07] px-3.5 py-2.5 text-[12px] leading-snug text-destructive"
      >
        {{ auth.error }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="w-full h-11 rounded-lg bg-primary text-primary-foreground text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
        :disabled="auth.loading"
      >
        <Loader2 v-if="auth.loading" :size="14" class="animate-spin" />
        {{ auth.loading ? 'Criando conta...' : 'Criar conta' }}
      </button>
    </form>

    <!-- Login link -->
    <p class="text-center text-[12px] text-muted-foreground/50">
      Já tem conta?
      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Entrar
      </RouterLink>
    </p>

  </div>
</template>
