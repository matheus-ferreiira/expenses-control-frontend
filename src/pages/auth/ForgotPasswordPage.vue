<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { Loader2, MailCheck } from 'lucide-vue-next'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { authApi } from '@/services/api/auth'
import { ROUTES } from '@/constants/routes'
import { useForgotPasswordForm } from '@/features/auth/composables/useForgotPasswordForm'

const { form, errors, sent, loading, validate } = useForgotPasswordForm()

onMounted(() => nextTick(() => (document.getElementById('email') as HTMLInputElement)?.focus()))

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
  <div class="space-y-6">

    <!-- Success state -->
    <template v-if="sent">
      <div class="flex flex-col items-center gap-6 py-4 text-center">
        <!-- Icon -->
        <div class="flex h-11 w-11 items-center justify-center rounded-full"
          style="background: hsl(var(--success) / 0.08); border: 1px solid hsl(var(--success) / 0.2);">
          <MailCheck :size="20" class="text-success" />
        </div>
        <!-- Text -->
        <div class="space-y-1.5">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">
            Verifique seu email
          </h1>
          <p class="text-[13px] leading-relaxed text-muted-foreground/60">
            Enviamos um link de acesso para<br />
            <span class="font-medium text-foreground/70">{{ form.email }}</span>
          </p>
        </div>
        <p class="text-[11px] text-muted-foreground/35 select-none">Verifique também a pasta de spam</p>
      </div>

      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="block text-center text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        ← Voltar ao login
      </RouterLink>
    </template>

    <!-- Form state -->
    <template v-else>
      <!-- Header -->
      <div class="space-y-1">
        <h1 class="text-xl font-semibold tracking-tight text-foreground">
          Esqueceu a senha?
        </h1>
        <p class="text-[13px] text-muted-foreground/60">
          Informe seu email e enviamos um link de acesso
        </p>
      </div>

      <!-- Form -->
      <form class="space-y-4" novalidate @submit.prevent="handleSubmit">

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
            :disabled="loading"
            :class="['h-10 transition-colors', errors.email ? 'border-destructive/60 focus-visible:ring-destructive/30' : '']"
            @input="errors.email = undefined"
          />
          <p v-if="errors.email" class="text-[11px] text-destructive/80">{{ errors.email }}</p>
        </div>

        <Button type="submit" class="w-full h-10 font-medium transition-opacity" :disabled="loading">
          <Loader2 v-if="loading" :size="13" class="mr-2 animate-spin" />
          {{ loading ? 'Enviando...' : 'Enviar link' }}
        </Button>
      </form>

      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="block text-center text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        ← Voltar ao login
      </RouterLink>
    </template>

  </div>
</template>
