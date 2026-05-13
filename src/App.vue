<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from '@ui/sonner'
import { TooltipProvider } from '@ui/tooltip'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (auth.token) auth.fetchMe()
})
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <RouterView />
    <Toaster position="top-right" :expand="true" :rich-colors="true" theme="dark" />
  </TooltipProvider>
</template>
