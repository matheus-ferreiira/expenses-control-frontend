<script setup lang="ts">
import { AuthBrandingPanel } from '@/features/auth/components'
</script>

<template>
  <div class="min-h-screen flex bg-background">

    <!-- Left: branding panel — desktop only -->
    <div class="hidden lg:flex lg:w-1/2 xl:w-[52%] flex-col">
      <AuthBrandingPanel />
    </div>

    <!-- Right: form panel -->
    <div class="flex flex-1 flex-col">
      <!-- Scroll container -->
      <div class="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">

        <!-- Mobile wordmark (shown only when left panel is hidden) -->
        <div class="lg:hidden mb-10 flex items-center gap-2.5">
          <span class="text-[17px] font-semibold tracking-tight text-foreground">Vault</span>
          <span
            class="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            style="border: 1px solid hsl(var(--border)); background: hsl(var(--muted) / 0.5);"
          >
            Beta
          </span>
        </div>

        <!-- Form container -->
        <div class="w-full max-w-[380px]">
          <RouterView />
        </div>

      </div>

      <!-- Footer -->
      <p class="text-center py-6 text-[11px] text-muted-foreground select-none">
        &copy; {{ new Date().getFullYear() }} Vault &mdash; uso pessoal
      </p>
    </div>

  </div>
</template>
