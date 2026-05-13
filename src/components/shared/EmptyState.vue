<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon?: Component
    title: string
    description?: string
  }>(),
  {},
)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div
      v-if="icon"
      class="mb-4 p-3 rounded-lg bg-muted text-muted-foreground"
    >
      <component :is="icon" :size="24" />
    </div>

    <h3 class="text-sm font-semibold text-foreground mb-1">{{ title }}</h3>

    <p v-if="description" class="text-sm text-muted-foreground max-w-xs">
      {{ description }}
    </p>

    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
