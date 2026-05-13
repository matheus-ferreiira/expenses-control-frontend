<script setup lang="ts">
import { Card } from '@ui/card'
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <!-- Logo mark -->
    <div class="mb-8 flex flex-col items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
        <span class="text-primary-foreground font-bold text-lg">P</span>
      </div>
      <span class="text-sm text-muted-foreground font-medium tracking-wide uppercase">
        Productivity Control
      </span>
    </div>

    <Card class="w-full max-w-sm p-6">
      <RouterView />
    </Card>
  </div>
</template>
