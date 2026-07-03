<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  category?: string
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-4 mb-6">
    <div class="min-w-0">
      <p
        v-if="category"
        class="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5 select-none"
        style="color: hsl(var(--muted-foreground) / 0.4)"
      >
        {{ category }}
      </p>
      <h1 class="text-[22px] font-semibold text-foreground tracking-tight leading-tight truncate">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-1 text-[13px] text-muted-foreground leading-snug">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0 mt-0.5">
      <slot name="actions" />
    </div>
  </div>
</template>
