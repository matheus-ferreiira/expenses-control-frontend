<script setup lang="ts">
import { CATEGORY_PRESET_COLORS } from '../utils/categoryColors'

defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [color: string] }>()
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <button
      v-for="c in CATEGORY_PRESET_COLORS"
      :key="c"
      type="button"
      class="rounded-full transition-all hover:scale-110"
      style="width: 32px; height: 32px; flex-shrink: 0"
      :style="{
        background: c,
        boxShadow: modelValue === c ? '0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--border))' : 'none',
      }"
      @click="$emit('update:modelValue', c)"
    />
  </div>
</template>
