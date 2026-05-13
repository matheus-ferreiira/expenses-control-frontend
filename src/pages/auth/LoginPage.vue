<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const emailInput = ref<HTMLInputElement | null>(null)

onMounted(() => emailInput.value?.focus())

async function handleLogin() {
  if (!validate()) return
  auth.error = null
  try {
    await auth.login({ email: form.email, password: form.password })
    const redirect = route.query.redirect as string | undefined
    router.push(redirect && redirect.startsWith('/') ? redirect : { name: ROUTES.DASHBOARD })
  } catch {
    // error already set by store
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold text-foreground tracking-tight">Bem-vindo de volta</h1>
      <p class="text-sm text-muted-foreground">Entre na sua conta para continuar</p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="handleLogin">
      <AppFormField label="Email" :error="errors.email" required html-for="email">
        <Input
          id="email"
          ref="emailInput"
          v-model="form.email"
          type="email"
          placeholder="voce@exemplo.com"
          autocomplete="email"
          :disabled="auth.loading"
          @input="errors.email = undefined"
        />
      </AppFormField>

      <AppFormField label="Senha" :error="errors.password" required html-for="password">
        <PasswordField
          id="password"
          v-model="form.password"
          placeholder="••••••••"
          :disabled="auth.loading"
          @input="errors.password = undefined"
        />
        <div class="flex justify-end mt-1">
          <RouterLink
            :to="{ name: ROUTES.FORGOT_PASSWORD }"
            class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Esqueceu a senha?
          </RouterLink>
        </div>
      </AppFormField>

      <div
        v-if="auth.error"
        class="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive"
      >
        {{ auth.error }}
      </div>

      <Button type="submit" class="w-full" :disabled="auth.loading">
        <Loader2 v-if="auth.loading" :size="15" class="mr-2 animate-spin" />
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </Button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      Não tem conta?
      <RouterLink
        :to="{ name: ROUTES.REGISTER }"
        class="text-foreground font-medium hover:underline underline-offset-4"
      >
        Criar conta
      </RouterLink>
    </p>
  </div>
</template>
