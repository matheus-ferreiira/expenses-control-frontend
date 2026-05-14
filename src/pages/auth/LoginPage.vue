<script setup lang="ts">
import { onMounted, nextTick, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import { PasswordField } from '@/features/auth/components'
import { useLoginForm } from '@/features/auth/composables/useLoginForm'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { form, errors, validate } = useLoginForm()
const rememberMe = ref(false)

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
      <p class="text-[13px] text-muted-foreground/60">
        Entre na sua conta para continuar
      </p>
    </div>

    <!-- OAuth buttons -->
    <div class="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        class="flex h-10 items-center justify-center gap-2.5 rounded-md border border-border bg-card text-[13px] font-medium text-foreground/70 transition-base hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled
      >
        <!-- Google icon -->
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google
      </button>
      <button
        type="button"
        class="flex h-10 items-center justify-center gap-2.5 rounded-md border border-border bg-card text-[13px] font-medium text-foreground/70 transition-base hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled
      >
        <!-- Apple icon -->
        <svg width="14" height="14" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true" class="text-foreground/80">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.5 0 663 0 541.8c0-194.3 127.4-297.5 252.2-297.5 66.1 0 121.2 43.4 162.6 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
        </svg>
        Apple
      </button>
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-border/60" />
      <span class="text-[11px] text-muted-foreground/40 select-none">ou continue com email</span>
      <div class="h-px flex-1 bg-border/60" />
    </div>

    <!-- Form -->
    <form class="space-y-4" novalidate @submit.prevent="handleLogin">

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

      <!-- Password -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="password" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
            Senha
          </label>
          <RouterLink
            :to="{ name: ROUTES.FORGOT_PASSWORD }"
            class="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-base"
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
        <p v-if="errors.password" class="text-[11px] text-destructive/80">{{ errors.password }}</p>
      </div>

      <!-- Remember me -->
      <label class="flex cursor-pointer items-center gap-2.5 select-none">
        <input type="checkbox" v-model="rememberMe" class="sr-only" />
        <div
          class="relative flex h-4 w-4 shrink-0 items-center justify-center rounded transition-base"
          :style="rememberMe ? { background: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary))' } : { border: '1px solid hsl(var(--border))' }"
        >
          <svg v-if="rememberMe" width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="text-[12px] text-muted-foreground/60">Lembrar sessão</span>
      </label>

      <!-- Backend error -->
      <div
        v-if="auth.error"
        class="rounded-md border border-destructive/20 bg-destructive/[0.07] px-3.5 py-2.5 text-[12px] leading-snug text-destructive"
      >
        {{ auth.error }}
      </div>

      <!-- Submit -->
      <Button
        type="submit"
        class="w-full h-10 font-medium transition-opacity"
        :disabled="auth.loading"
      >
        <Loader2 v-if="auth.loading" :size="13" class="mr-2 animate-spin" />
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </Button>
    </form>

    <!-- Sign up link -->
    <p class="text-center text-[12px] text-muted-foreground/50">
      Não tem conta?
      <RouterLink
        :to="{ name: ROUTES.REGISTER }"
        class="font-medium text-foreground/70 hover:text-foreground transition-base underline underline-offset-4 decoration-border/60"
      >
        Criar conta
      </RouterLink>
    </p>

  </div>
</template>
