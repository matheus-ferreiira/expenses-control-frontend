<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@ui/input'
import { Eye, EyeOff } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    id?: string
    disabled?: boolean
    error?: boolean
  }>(),
  { placeholder: 'Senha', error: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)
</script>

<template>
  <div class="relative">
    <Input
      :id="id"
      :type="visible ? 'text' : 'password'"
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['h-10 pr-10 transition-colors', error ? 'border-destructive/60 focus-visible:ring-destructive/30' : '']"
      autocomplete="current-password"
      @update:model-value="emit('update:modelValue', String($event))"
    />
    <button
      type="button"
      tabindex="-1"
      :disabled="disabled"
      class="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-150 disabled:pointer-events-none"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="14" />
      <Eye v-else :size="14" />
    </button>
  </div>
</template>
