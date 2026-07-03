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
  <div>
    <!-- Label -->
    <label
      v-if="label"
      :for="htmlFor"
      class="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-destructive ml-0.5">*</span>
    </label>

    <!-- Input control -->
    <slot />

    <!-- Error message -->
    <p v-if="error" class="text-xs text-destructive flex items-center gap-1 mt-1">
      <span>{{ error }}</span>
    </p>

    <!-- Hint -->
    <p v-else-if="hint" class="text-xs text-muted-foreground mt-1">{{ hint }}</p>
  </div>
</template>
