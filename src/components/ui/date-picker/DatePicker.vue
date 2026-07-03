<script setup lang="ts">
import { computed, ref } from 'vue'
import { type DateValue, CalendarDate, parseDate } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Calendar } from '@ui/calendar'

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
      <button
        type="button"
        class="h-10 w-full flex items-center gap-2.5 px-3.5 rounded-lg bg-card text-left transition-colors hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled"
        :class="props.class"
      >
        <CalendarIcon :size="14" class="shrink-0 text-muted-foreground" />
        <span class="flex-1 truncate text-[13px]"
              :class="modelValue ? 'text-foreground' : 'text-muted-foreground'">
          {{ displayLabel }}
        </span>
      </button>
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
          type="button"
          class="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          @click="clearDate"
        >
          Limpar data
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
