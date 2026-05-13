<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/services/api/auth'
import { ROUTES } from '@/constants/routes'

const route = useRoute()
const router = useRouter()

const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await authApi.resetPassword({
      token: route.query.token as string,
      email: route.query.email as string,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    router.push({ name: ROUTES.LOGIN })
  } catch {
    error.value = 'Erro ao redefinir senha. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-foreground">Nova senha</h1>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <input
        v-model="password"
        type="password"
        placeholder="Nova senha"
        class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <input
        v-model="passwordConfirmation"
        type="password"
        placeholder="Confirmar nova senha"
        class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {{ loading ? 'Salvando...' : 'Redefinir senha' }}
      </button>
    </form>
  </div>
</template>
