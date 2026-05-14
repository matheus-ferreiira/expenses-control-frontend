<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
  ctaLabel?: string
  ctaIcon?: Component
}>()

const emit = defineEmits<{ cta: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 px-6 text-center select-none">
    <!-- Icon container -->
    <div
      v-if="icon"
      class="flex items-center justify-center w-10 h-10 rounded-xl mb-5"
      style="background: hsl(var(--foreground) / 0.03); border: 1px solid hsl(var(--border) / 0.6)"
    >
      <component :is="icon" :size="17" style="color: hsl(var(--muted-foreground) / 0.35)" />
    </div>

    <!-- Title -->
    <p class="text-[13.5px] font-medium leading-snug mb-1.5" style="color: hsl(var(--foreground) / 0.5)">
      {{ title }}
    </p>

    <!-- Description -->
    <p
      v-if="description"
      class="text-[12px] leading-relaxed max-w-[220px]"
      style="color: hsl(var(--muted-foreground) / 0.38)"
    >
      {{ description }}
    </p>

    <!-- CTA -->
    <button
      v-if="ctaLabel"
      class="mt-5 flex items-center gap-1.5 text-[12px] font-medium transition-base"
      style="color: hsl(var(--primary) / 0.65)"
      @mouseenter="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))'"
      @mouseleave="($event.currentTarget as HTMLElement).style.color = 'hsl(var(--primary) / 0.65)'"
      @click="emit('cta')"
    >
      <component v-if="ctaIcon" :is="ctaIcon" :size="11" />
      {{ ctaLabel }}
    </button>

    <!-- Slot fallback for custom actions -->
    <div v-if="!ctaLabel && $slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
