<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
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

onMounted(() => nextTick(() => (document.getElementById('name') as HTMLInputElement)?.focus()))

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
  <div class="space-y-7">
    <!-- Header -->
    <div>
      <h1 class="text-[22px] font-bold tracking-tight text-foreground leading-snug">
        Criar conta
      </h1>
      <p class="mt-1 text-[13px] leading-normal text-muted-foreground/70">
        Comece a organizar sua produtividade
      </p>
    </div>

    <!-- Form -->
    <form class="space-y-4" novalidate @submit.prevent="handleRegister">
      <AppFormField label="Nome" :error="errors.name" required html-for="name">
        <Input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Seu nome"
          autocomplete="name"
          :disabled="auth.loading"
          class="h-10 transition-colors"
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
          class="h-10 transition-colors"
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
        {{ auth.loading ? 'Criando conta...' : 'Criar conta' }}
      </Button>
    </form>

    <!-- Login link -->
    <p class="text-center text-[13px] text-muted-foreground/60">
      Já tem conta?
      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="font-medium text-foreground/80 underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-150"
      >
        Entrar
      </RouterLink>
    </p>
  </div>
</template>
