<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@stores/auth'
import { ROUTES } from '@constants/routes'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  const token = route.query.token as string | undefined
  const error = route.query.error as string | undefined

  if (error || !token) {
    router.replace({ name: ROUTES.LOGIN, query: { error: 'google_auth_failed' } })
    return
  }

  try {
    await auth.loginWithToken(token)
    router.replace({ name: ROUTES.DASHBOARD })
  } catch {
    router.replace({ name: ROUTES.LOGIN, query: { error: 'google_auth_failed' } })
  }
})
</script>

<template>
  <div class="flex h-screen items-center justify-center bg-background">
    <div class="flex items-center gap-3 text-muted-foreground">
      <Loader2 :size="20" class="animate-spin" />
      <span class="text-[13px]">Autenticando com Google...</span>
    </div>
  </div>
</template>
