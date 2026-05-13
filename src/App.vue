<script setup lang="ts">
import { Toaster } from '@ui/sonner'
import { TooltipProvider } from '@ui/tooltip'
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <RouterView />
    <Toaster position="top-right" :expand="true" :rich-colors="true" theme="dark" />
  </TooltipProvider>
</template>
