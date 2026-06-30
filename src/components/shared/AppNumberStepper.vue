<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function clamp(n: number): number {
  return Math.min(props.max, Math.max(props.min, n))
}

function decrement() {
  emit('update:modelValue', clamp(props.modelValue - 1))
}

function increment() {
  emit('update:modelValue', clamp(props.modelValue + 1))
}

function onInput(e: Event) {
  const input = e.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  input.value = digits
  if (!digits) return
  emit('update:modelValue', parseInt(digits, 10))
}

function onBlur(e: Event) {
  const input = e.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  const clamped = clamp(digits ? parseInt(digits, 10) : props.modelValue)
  input.value = String(clamped)
  if (clamped !== props.modelValue) emit('update:modelValue', clamped)
}
</script>

<template>
  <div class="inline-flex items-center h-11 rounded-lg border border-border bg-card overflow-hidden shrink-0">
    <button
      type="button"
      class="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground active:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      :disabled="modelValue <= min"
      aria-label="Diminuir"
      @click="decrement"
    >
      <Minus :size="14" aria-hidden="true" />
    </button>
    <input
      type="text"
      inputmode="numeric"
      class="w-12 h-11 text-center text-[14px] font-semibold tabular-nums text-foreground bg-transparent outline-none"
      :value="modelValue"
      @input="onInput"
      @blur="onBlur"
    />
    <button
      type="button"
      class="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground active:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      :disabled="modelValue >= max"
      aria-label="Aumentar"
      @click="increment"
    >
      <Plus :size="14" aria-hidden="true" />
    </button>
  </div>
</template>
