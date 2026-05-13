<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { Eye, EyeOff } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    id?: string
    disabled?: boolean
  }>(),
  { placeholder: 'Senha' },
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
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="pr-10"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      tabindex="-1"
      class="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="15" />
      <Eye v-else :size="15" />
    </Button>
  </div>
</template>
