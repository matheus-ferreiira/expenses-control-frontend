<script setup lang="ts">
import type { Component } from 'vue'
import { Plus } from 'lucide-vue-next'

const props = defineProps<{
  icon?: Component
  title: string
  description?: string
  ctaLabel?: string
  ctaIcon?: Component
}>()

const emit = defineEmits<{ cta: [] }>()

const ctaIconResolved = props.ctaIcon ?? Plus
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-6 text-center select-none">
    <!-- Icon container -->
    <div
      v-if="icon"
      class="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
      style="background: hsl(var(--muted) / 0.6); border: 1px solid hsl(var(--border) / 0.5)"
    >
      <component :is="icon" :size="22" style="color: hsl(var(--muted-foreground) / 0.5)" />
    </div>

    <!-- Title -->
    <p class="text-[14px] font-semibold leading-snug mb-1" style="color: hsl(var(--foreground) / 0.7)">
      {{ title }}
    </p>

    <!-- Description -->
    <p
      v-if="description"
      class="text-[12.5px] leading-relaxed max-w-[240px]"
      style="color: hsl(var(--muted-foreground) / 0.5)"
    >
      {{ description }}
    </p>

    <!-- CTA button -->
    <button
      v-if="ctaLabel"
      class="mt-5 flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      @click="emit('cta')"
    >
      <component :is="ctaIconResolved" :size="12" />
      {{ ctaLabel }}
    </button>

    <!-- Slot fallback for custom actions -->
    <div v-if="!ctaLabel && $slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
