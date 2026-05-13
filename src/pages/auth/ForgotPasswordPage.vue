<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '@/services/api/auth'
import { ROUTES } from '@/constants/routes'

const email = ref('')
const sent = ref(false)
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await authApi.forgotPassword({ email: email.value })
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-foreground">Esqueceu a senha?</h1>
      <p class="text-muted-foreground mt-1">Enviaremos um link de redefinição</p>
    </div>

    <div v-if="sent" class="p-4 bg-accent rounded-md text-sm text-foreground">
      Email enviado! Verifique sua caixa de entrada.
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {{ loading ? 'Enviando...' : 'Enviar link' }}
      </button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      <RouterLink :to="{ name: ROUTES.LOGIN }" class="text-primary hover:underline">
        Voltar ao login
      </RouterLink>
    </p>
  </div>
</template>
