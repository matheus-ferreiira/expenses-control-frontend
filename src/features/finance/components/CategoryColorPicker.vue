<script setup lang="ts">
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [color: string] }>()

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#0ea5e9',
]
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <button
      v-for="c in PRESET_COLORS"
      :key="c"
      type="button"
      class="rounded-full transition-all hover:scale-110"
      style="width: 32px; height: 32px; flex-shrink: 0"
      :style="{
        background: c,
        boxShadow: modelValue === c ? '0 0 0 2px #080808, 0 0 0 4px #F0F0F0' : 'none',
      }"
      @click="$emit('update:modelValue', c)"
    />
  </div>
</template>
