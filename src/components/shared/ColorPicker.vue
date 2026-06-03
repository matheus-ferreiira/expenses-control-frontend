<script setup lang="ts">
import { ICON_PALETTE_COLORS } from '@/lib/icons'

const props = defineProps<{
  modelValue: string
  colors?: readonly string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const palette = props.colors ?? ICON_PALETTE_COLORS
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <button
      v-for="color in palette"
      :key="color"
      type="button"
      :title="color"
      :class="[
        'w-7 h-7 rounded-full transition-all hover:scale-110',
        modelValue === color
          ? 'ring-2 ring-offset-2 ring-offset-background ring-primary'
          : '',
      ]"
      :style="{ backgroundColor: color }"
      @click="emit('update:modelValue', color)"
    />
  </div>
</template>
