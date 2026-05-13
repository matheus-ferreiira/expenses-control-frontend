<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@ui/badge'
import type { TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_LABELS } from '@/types/tasks'
import { PRIORITY_STYLE } from '../types'

const props = defineProps<{
  priority: TaskPriority
  dot?: boolean
}>()

const style = computed(() => PRIORITY_STYLE[props.priority] ?? PRIORITY_STYLE.normal)
const label = computed(() => TASK_PRIORITY_LABELS[props.priority] ?? TASK_PRIORITY_LABELS.normal)
</script>

<template>
  <Badge
    variant="outline"
    :class="['gap-1 border-transparent font-medium text-[11px] px-1.5 py-0.5', style.bg, style.text]"
  >
    <span v-if="dot" :class="['inline-block w-1.5 h-1.5 rounded-full', style.dot]" />
    {{ label }}
  </Badge>
</template>
