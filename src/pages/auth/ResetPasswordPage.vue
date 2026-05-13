<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { authApi } from '@/services/api/auth'
import { ROUTES } from '@/constants/routes'
import { AppFormField } from '@/components/shared'
import { PasswordField } from '@/features/auth/components'
import { useResetPasswordForm } from '@/features/auth/composables/useResetPasswordForm'

const route = useRoute()
const router = useRouter()
const { form, errors, validate } = useResetPasswordForm()

const loading = ref(false)
const apiError = ref<string | null>(null)

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  apiError.value = null
  try {
    await authApi.resetPassword({
      token: route.query.token as string,
      email: route.query.email as string,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })
    router.push({ name: ROUTES.LOGIN })
  } catch {
    apiError.value = 'Link inválido ou expirado. Solicite um novo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-7">
    <!-- Header -->
    <div>
      <h1 class="text-[22px] font-bold tracking-tight text-foreground leading-snug">
        Redefinir senha
      </h1>
      <p class="mt-1 text-[13px] leading-normal text-muted-foreground/70">
        Escolha uma senha forte para sua conta
      </p>
    </div>

    <!-- Form -->
    <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
      <AppFormField label="Nova senha" :error="errors.password" required html-for="password">
        <PasswordField
          id="password"
          v-model="form.password"
          placeholder="Mínimo 8 caracteres"
          :disabled="loading"
          @input="errors.password = undefined"
        />
      </AppFormField>

      <AppFormField label="Confirmar senha" :error="errors.password_confirmation" required html-for="password_confirmation">
        <PasswordField
          id="password_confirmation"
          v-model="form.password_confirmation"
          placeholder="••••••••"
          :disabled="loading"
          @input="errors.password_confirmation = undefined"
        />
      </AppFormField>

      <!-- API error -->
      <div
        v-if="apiError"
        class="rounded-lg border border-destructive/20 bg-destructive/[0.08] px-3.5 py-3 text-[13px] leading-snug text-destructive"
      >
        {{ apiError }}
      </div>

      <!-- Submit -->
      <Button type="submit" class="w-full h-10 mt-1 font-medium" :disabled="loading">
        <Loader2 v-if="loading" :size="14" class="mr-2 animate-spin" />
        {{ loading ? 'Salvando...' : 'Redefinir senha' }}
      </Button>
    </form>

    <RouterLink
      :to="{ name: ROUTES.LOGIN }"
      class="block text-center text-[13px] text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
    >
      ← Voltar ao login
    </RouterLink>
  </div>
</template>
