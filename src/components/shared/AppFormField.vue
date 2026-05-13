<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    error?: string
    hint?: string
    required?: boolean
    htmlFor?: string
  }>(),
  { required: false },
)
</script>

<template>
  <div class="space-y-1.5">
    <!-- Label -->
    <label
      v-if="label"
      :for="htmlFor"
      class="block text-sm font-medium text-foreground"
    >
      {{ label }}
      <span v-if="required" class="text-destructive ml-0.5">*</span>
    </label>

    <!-- Input control -->
    <slot />

    <!-- Error message -->
    <p v-if="error" class="text-xs text-destructive flex items-center gap-1">
      <span>{{ error }}</span>
    </p>

    <!-- Hint -->
    <p v-else-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
