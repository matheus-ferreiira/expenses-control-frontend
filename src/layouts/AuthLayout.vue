<script setup lang="ts">
import { Card } from '@ui/card'
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <!-- Logo -->
    <div class="mb-7 flex flex-col items-center gap-2.5">
      <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
        <span class="text-primary-foreground font-bold text-base">P</span>
      </div>
      <span class="text-xs text-muted-foreground font-medium tracking-widest uppercase">
        Productivity
      </span>
    </div>

    <Card class="w-full max-w-sm p-7 shadow-none border-border/60">
      <RouterView />
    </Card>

    <!-- Footer -->
    <p class="mt-8 text-xs text-muted-foreground/50">
      &copy; {{ new Date().getFullYear() }} Productivity Control
    </p>
  </div>
</template>
