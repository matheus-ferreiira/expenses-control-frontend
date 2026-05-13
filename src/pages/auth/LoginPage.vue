<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  await auth.login({ email: email.value, password: password.value })
  router.push({ name: ROUTES.DASHBOARD })
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-foreground">Productivity Control</h1>
      <p class="text-muted-foreground mt-1">Entre na sua conta</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="Senha"
        class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <p v-if="auth.error" class="text-sm text-destructive">{{ auth.error }}</p>
      <button
        type="submit"
        :disabled="auth.loading"
        class="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      Não tem conta?
      <RouterLink :to="{ name: ROUTES.REGISTER }" class="text-primary hover:underline">
        Criar conta
      </RouterLink>
    </p>
  </div>
</template>
