<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'
import { AppFormField } from '@/components/shared'
import { PasswordField } from '@/features/auth/components'
import { useRegisterForm } from '@/features/auth/composables/useRegisterForm'

const router = useRouter()
const auth = useAuthStore()
const { form, errors, validate } = useRegisterForm()

const nameInput = ref<HTMLInputElement | null>(null)

onMounted(() => nameInput.value?.focus())

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
    // error already set by store
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold text-foreground tracking-tight">Criar conta</h1>
      <p class="text-sm text-muted-foreground">Comece a organizar sua produtividade</p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="handleRegister">
      <AppFormField label="Nome" :error="errors.name" required html-for="name">
        <Input
          id="name"
          ref="nameInput"
          v-model="form.name"
          type="text"
          placeholder="Seu nome"
          autocomplete="name"
          :disabled="auth.loading"
          @input="errors.name = undefined"
        />
      </AppFormField>

      <AppFormField label="Email" :error="errors.email" required html-for="email">
        <Input
          id="email"
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
          placeholder="Mínimo 8 caracteres"
          :disabled="auth.loading"
          @input="errors.password = undefined"
        />
      </AppFormField>

      <AppFormField label="Confirmar senha" :error="errors.password_confirmation" required html-for="password_confirmation">
        <PasswordField
          id="password_confirmation"
          v-model="form.password_confirmation"
          placeholder="••••••••"
          :disabled="auth.loading"
          @input="errors.password_confirmation = undefined"
        />
      </AppFormField>

      <div
        v-if="auth.error"
        class="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive"
      >
        {{ auth.error }}
      </div>

      <Button type="submit" class="w-full" :disabled="auth.loading">
        <Loader2 v-if="auth.loading" :size="15" class="mr-2 animate-spin" />
        {{ auth.loading ? 'Criando conta...' : 'Criar conta' }}
      </Button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      Já tem conta?
      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="text-foreground font-medium hover:underline underline-offset-4"
      >
        Entrar
      </RouterLink>
    </p>
  </div>
</template>
