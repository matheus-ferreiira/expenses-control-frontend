<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')

async function handleRegister() {
  await auth.register({
    name: name.value,
    email: email.value,
    password: password.value,
    password_confirmation: passwordConfirmation.value,
  })
  router.push({ name: ROUTES.DASHBOARD })
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-foreground">Criar conta</h1>
      <p class="text-muted-foreground mt-1">Comece a organizar sua vida</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleRegister">
      <input
        v-model="name"
        type="text"
        placeholder="Nome"
        class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
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
      <input
        v-model="passwordConfirmation"
        type="password"
        placeholder="Confirmar senha"
        class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <p v-if="auth.error" class="text-sm text-destructive">{{ auth.error }}</p>
      <button
        type="submit"
        :disabled="auth.loading"
        class="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {{ auth.loading ? 'Criando...' : 'Criar conta' }}
      </button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      Já tem conta?
      <RouterLink :to="{ name: ROUTES.LOGIN }" class="text-primary hover:underline">
        Entrar
      </RouterLink>
    </p>
  </div>
</template>
