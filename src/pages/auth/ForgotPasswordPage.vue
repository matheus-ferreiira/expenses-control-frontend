<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader2, MailCheck } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { authApi } from '@/services/api/auth'
import { ROUTES } from '@/constants/routes'
import { AppFormField } from '@/components/shared'
import { useForgotPasswordForm } from '@/features/auth/composables/useForgotPasswordForm'

const { form, errors, sent, loading, validate } = useForgotPasswordForm()
const emailInput = ref<HTMLInputElement | null>(null)

onMounted(() => emailInput.value?.focus())

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await authApi.forgotPassword({ email: form.email })
    sent.value = true
  } catch {
    errors.email = 'Não foi possível enviar o email. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Success state -->
    <template v-if="sent">
      <div class="flex flex-col items-center gap-4 py-4 text-center">
        <div class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <MailCheck :size="22" class="text-emerald-400" />
        </div>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-foreground tracking-tight">Email enviado</h1>
          <p class="text-sm text-muted-foreground">
            Enviamos um link de redefinição para<br />
            <span class="text-foreground font-medium">{{ form.email }}</span>
          </p>
        </div>
        <p class="text-xs text-muted-foreground">Verifique também a pasta de spam</p>
      </div>

      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Voltar ao login
      </RouterLink>
    </template>

    <!-- Form state -->
    <template v-else>
      <div class="space-y-1">
        <h1 class="text-xl font-semibold text-foreground tracking-tight">Esqueceu a senha?</h1>
        <p class="text-sm text-muted-foreground">
          Insira seu email para receber um link de redefinição
        </p>
      </div>

      <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
        <AppFormField label="Email" :error="errors.email" required html-for="email">
          <Input
            id="email"
            ref="emailInput"
            v-model="form.email"
            type="email"
            placeholder="voce@exemplo.com"
            autocomplete="email"
            :disabled="loading"
            @input="errors.email = undefined"
          />
        </AppFormField>

        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2 v-if="loading" :size="15" class="mr-2 animate-spin" />
          {{ loading ? 'Enviando...' : 'Enviar link' }}
        </Button>
      </form>

      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Voltar ao login
      </RouterLink>
    </template>
  </div>
</template>
