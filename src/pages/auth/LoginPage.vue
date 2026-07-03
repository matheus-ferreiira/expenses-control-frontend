<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import { PasswordField } from '@/features/auth/components'
import { useLoginForm } from '@/features/auth/composables/useLoginForm'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { form, errors, validate } = useLoginForm()

onMounted(() => nextTick(() => (document.getElementById('email') as HTMLInputElement)?.focus()))

async function handleLogin() {
  if (!validate()) return
  auth.error = null
  try {
    await auth.login({ email: form.email, password: form.password })
    const redirect = route.query.redirect as string | undefined
    router.push(redirect && redirect.startsWith('/') ? redirect : { name: ROUTES.DASHBOARD })
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
        Bem-vindo de volta
      </h1>
      <p class="text-[13px] text-muted-foreground">
        Entre na sua conta para continuar
      </p>
    </div>

    <!-- OAuth buttons -->
    <a
      :href="`${apiUrl}/api/v1/auth/google/redirect`"
      class="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-card text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" class="shrink-0">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Entrar com Google
    </a>

    <!-- Divider -->
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-border" />
      <span class="text-[11px] text-muted-foreground select-none">ou continue com email</span>
      <div class="h-px flex-1 bg-border" />
    </div>

    <!-- Form -->
    <form class="space-y-4" novalidate @submit.prevent="handleLogin">

      <!-- Email -->
      <div class="space-y-1.5">
        <label for="email" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Email
        </label>
        <Input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="voce@exemplo.com"
          autocomplete="email"
          :disabled="auth.loading"
          :class="['h-10 transition-base', errors.email ? ' focus-visible:ring-primary' : '']"
          @input="errors.email = undefined"
        />
        <p v-if="errors.email" class="text-[11px] text-destructive">{{ errors.email }}</p>
      </div>

      <!-- Password -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="password" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Senha
          </label>
          <RouterLink
            :to="{ name: ROUTES.FORGOT_PASSWORD }"
            class="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Esqueceu a senha?
          </RouterLink>
        </div>
        <PasswordField
          id="password"
          v-model="form.password"
          placeholder="••••••••"
          :disabled="auth.loading"
          :error="!!errors.password"
          @input="errors.password = undefined"
        />
        <p v-if="errors.password" class="text-[11px] text-destructive">{{ errors.password }}</p>
      </div>

      <!-- Backend error -->
      <div
        v-if="auth.error"
        class="rounded-md bg-destructive/[0.07] px-3.5 py-2.5 text-[12px] leading-snug text-destructive"
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
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <!-- Sign up link -->
    <p class="text-center text-[12px] text-muted-foreground">
      Não tem conta?
      <RouterLink
        :to="{ name: ROUTES.REGISTER }"
        class="font-semibold text-primary hover:text-primary transition-colors"
      >
        Criar conta
      </RouterLink>
    </p>

  </div>
</template>
