<script setup lang="ts">
// no imports — pure template layout
</script>

<template>
  <div class="relative min-h-screen bg-background flex flex-col items-center justify-center p-5 overflow-hidden">
    <!-- Subtle background glow (primary violet, barely visible) -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute -top-32 left-1/2 h-[560px] w-[700px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[130px]" />
    </div>

    <div class="relative z-10 w-full max-w-[400px]">
      <!-- Logo mark -->
      <div class="mb-8 flex flex-col items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary ring-1 ring-primary/40 shadow-lg shadow-primary/20">
          <span class="text-[15px] font-bold text-primary-foreground">P</span>
        </div>
        <span class="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground/50 uppercase select-none">
          Productivity
        </span>
      </div>

      <!-- Auth card -->
      <div class="rounded-xl border border-white/[0.06] bg-card shadow-2xl shadow-black/50 ring-1 ring-white/[0.04]">
        <div class="p-8">
          <RouterView />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p class="relative mt-8 text-[11px] text-muted-foreground/30 select-none">
      &copy; {{ new Date().getFullYear() }} Productivity Control
    </p>
  </div>
</template>
