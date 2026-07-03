<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@ui/button'
import { authApi } from '@/services/api/auth'
import { ROUTES } from '@/constants/routes'
import { PasswordField } from '@/features/auth/components'
import { useResetPasswordForm } from '@/features/auth/composables/useResetPasswordForm'

const route = useRoute()
const router = useRouter()
const { form, errors, validate } = useResetPasswordForm()

const loading = ref(false)
const apiError = ref<string | null>(null)

const tokenParam = route.query.token as string | undefined
const emailParam = route.query.email as string | undefined
const invalidLink = !tokenParam || !emailParam

// Password strength: 0–4
const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => {
  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  return labels[passwordStrength.value] ?? ''
})

const strengthColor = computed(() => {
  const colors = ['', 'bg-muted', 'bg-muted', 'bg-muted', 'bg-success']
  return colors[passwordStrength.value] ?? ''
})

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  apiError.value = null
  try {
    await authApi.resetPassword({
      token: tokenParam!,
      email: emailParam!,
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
  <div class="space-y-6">

    <!-- Invalid link state -->
    <template v-if="invalidLink">
      <div class="space-y-1">
        <h1 class="text-xl font-semibold tracking-tight text-foreground">Link inválido</h1>
        <p class="text-[13px] text-muted-foreground">
          Este link de redefinição é inválido ou expirou.
        </p>
      </div>
      <RouterLink
        :to="{ name: ROUTES.FORGOT_PASSWORD }"
        class="block text-center text-[13px] font-medium text-foreground hover:text-foreground transition-base underline underline-offset-4 decoration-border/60"
      >
        Solicitar novo link
      </RouterLink>
      <RouterLink
        :to="{ name: ROUTES.LOGIN }"
        class="block text-center text-[12px] text-muted-foreground hover:text-muted-foreground transition-base"
      >
        ← Voltar ao login
      </RouterLink>
    </template>

    <!-- Form -->
    <template v-else>
    <form class="space-y-4" novalidate @submit.prevent="handleSubmit">

      <!-- New password -->
      <div class="space-y-1.5">
        <label for="password" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Nova senha
        </label>
        <PasswordField
          id="password"
          v-model="form.password"
          placeholder="Mínimo 8 caracteres"
          autocomplete="new-password"
          :disabled="loading"
          :error="!!errors.password"
          @update:model-value="errors.password = undefined"
        />
        <!-- Strength bars -->
        <div v-if="form.password" class="flex items-center gap-2 pt-0.5">
          <div class="flex gap-1 flex-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-0.5 flex-1 rounded-full transition-all duration-300"
              :class="i <= passwordStrength ? strengthColor : 'bg-border'"
            />
          </div>
          <span class="text-[10px] text-muted-foreground shrink-0">{{ strengthLabel }}</span>
        </div>
        <p v-if="errors.password" class="text-[11px] text-destructive">{{ errors.password }}</p>
      </div>

      <!-- Confirm password -->
      <div class="space-y-1.5">
        <label for="password_confirmation" class="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Confirmar senha
        </label>
        <PasswordField
          id="password_confirmation"
          v-model="form.password_confirmation"
          placeholder="••••••••"
          autocomplete="new-password"
          :disabled="loading"
          :error="!!errors.password_confirmation"
          @update:model-value="errors.password_confirmation = undefined"
        />
        <p v-if="errors.password_confirmation" class="text-[11px] text-destructive">{{ errors.password_confirmation }}</p>
      </div>

      <!-- API error -->
      <div
        v-if="apiError"
        class="rounded-md bg-destructive/[0.07] px-3.5 py-2.5 text-[12px] leading-snug text-destructive"
      >
        {{ apiError }}
      </div>

      <!-- Submit -->
      <Button type="submit" class="w-full h-10 font-medium transition-opacity" :disabled="loading">
        <Loader2 v-if="loading" :size="13" class="mr-2 animate-spin" />
        {{ loading ? 'Salvando...' : 'Redefinir senha' }}
      </Button>
    </form>

    <RouterLink
      :to="{ name: ROUTES.LOGIN }"
      class="block text-center text-[12px] text-muted-foreground hover:text-muted-foreground transition-base"
    >
      ← Voltar ao login
    </RouterLink>

    </template><!-- end v-else -->

  </div>
</template>
