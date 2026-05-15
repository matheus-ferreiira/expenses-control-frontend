<script setup lang="ts">
import { computed, ref } from 'vue'
import { type DateValue, CalendarDate, parseDate } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Button } from '@ui/button'
import { Calendar } from '@ui/calendar'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue?: string | null
  placeholder?: string
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const open = ref(false)

function toCalendarDate(iso: string | null | undefined): CalendarDate | undefined {
  if (!iso) return undefined
  try { return parseDate(iso) } catch { return undefined }
}

const calendarValue = computed(() => toCalendarDate(props.modelValue))

const displayLabel = computed(() => {
  if (!props.modelValue) return props.placeholder ?? 'Selecionar data'
  try {
    const d = new Date(props.modelValue + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return props.modelValue }
})

function onSelect(val: DateValue | undefined) {
  if (!val) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', val.toString())
  open.value = false
}

function clearDate() {
  emit('update:modelValue', null)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'h-9 w-full justify-start text-left font-normal px-3 gap-2',
          !modelValue && 'text-muted-foreground',
          props.class,
        )"
        :disabled="disabled"
      >
        <CalendarIcon :size="14" class="shrink-0 opacity-50" />
        <span class="flex-1 truncate text-[13px]">{{ displayLabel }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="calendarValue"
        :initial-focus="true"
        locale="pt-BR"
        @update:model-value="onSelect"
      />
      <div v-if="modelValue" class="border-t border-border px-3 py-2">
        <button
          class="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          @click="clearDate"
        >
          Limpar data
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
