<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import { AppFormField } from '@/components/shared'
import { PasswordField } from '@/features/auth/components'
import { useLoginForm } from '@/features/auth/composables/useLoginForm'

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
  <div class="space-y-7">
    <!-- Header -->
    <div>
      <h1 class="text-[22px] font-bold tracking-tight text-foreground leading-snug">
        Bem-vindo de volta
      </h1>
      <p class="mt-1 text-[13px] leading-normal text-muted-foreground/70">
        Entre na sua conta para continuar
      </p>
    </div>

    <!-- Form -->
    <form class="space-y-4" novalidate @submit.prevent="handleLogin">
      <!-- Email -->
      <AppFormField label="Email" :error="errors.email" required html-for="email">
        <Input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="voce@exemplo.com"
          autocomplete="email"
          :disabled="auth.loading"
          class="h-10 transition-colors"
          @input="errors.email = undefined"
        />
      </AppFormField>

      <!-- Password — inline label + forgot link -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="password" class="text-sm font-medium text-foreground leading-none">
            Senha <span class="text-destructive ml-0.5">*</span>
          </label>
          <RouterLink
            :to="{ name: ROUTES.FORGOT_PASSWORD }"
            class="text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
          >
            Esqueceu a senha?
          </RouterLink>
        </div>
        <PasswordField
          id="password"
          v-model="form.password"
          placeholder="••••••••"
          :disabled="auth.loading"
          @input="errors.password = undefined"
        />
        <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
      </div>

      <!-- Backend error -->
      <div
        v-if="auth.error"
        class="rounded-lg border border-destructive/20 bg-destructive/[0.08] px-3.5 py-3 text-[13px] leading-snug text-destructive"
      >
        {{ auth.error }}
      </div>

      <!-- Submit -->
      <Button type="submit" class="w-full h-10 mt-1 font-medium" :disabled="auth.loading">
        <Loader2 v-if="auth.loading" :size="14" class="mr-2 animate-spin" />
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </Button>
    </form>

    <!-- Sign up -->
    <p class="text-center text-[13px] text-muted-foreground/60">
      Não tem conta?
      <RouterLink
        :to="{ name: ROUTES.REGISTER }"
        class="font-medium text-foreground/80 underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-150"
      >
        Criar conta
      </RouterLink>
    </p>
  </div>
</template>
