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
    errors.email = 'Não foi possível enviar. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-7">
    <!-- Success state -->
    <template v-if="sent">
      <div class="flex flex-col items-center gap-5 py-3 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/20">
          <MailCheck :size="22" class="text-success" />
        </div>
        <div class="space-y-1.5">
          <h1 class="text-[22px] font-bold tracking-tight text-foreground leading-snug">
            Email enviado
          </h1>
          <p class="text-[13px] leading-relaxed text-muted-foreground/70">
            Enviamos um link de redefinição para<br />
            <span class="font-medium text-foreground/80">{{ form.email }}</span>
          </p>
        </div>
        <p class="text-[12px] text-muted-foreground/40">Verifique também a pasta de spam</p>
      </div>

      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="block text-center text-[13px] text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
      >
        ← Voltar ao login
      </RouterLink>
    </template>

    <!-- Form state -->
    <template v-else>
      <div>
        <h1 class="text-[22px] font-bold tracking-tight text-foreground leading-snug">
          Esqueceu a senha?
        </h1>
        <p class="mt-1 text-[13px] leading-normal text-muted-foreground/70">
          Insira seu email e enviamos um link de acesso
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
            class="h-10 transition-colors"
            @input="errors.email = undefined"
          />
        </AppFormField>

        <Button type="submit" class="w-full h-10 mt-1 font-medium" :disabled="loading">
          <Loader2 v-if="loading" :size="14" class="mr-2 animate-spin" />
          {{ loading ? 'Enviando...' : 'Enviar link' }}
        </Button>
      </form>

      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="block text-center text-[13px] text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
      >
        ← Voltar ao login
      </RouterLink>
    </template>
  </div>
</template>
