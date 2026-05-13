<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@ui/badge'
import type { TaskStatus } from '@/types/tasks'
import { TASK_STATUS_LABELS } from '@/types/tasks'
import { STATUS_STYLE } from '../types'

const props = defineProps<{
  status: TaskStatus
}>()

const style = computed(() => STATUS_STYLE[props.status])
const label = computed(() => TASK_STATUS_LABELS[props.status])
</script>

<template>
  <Badge
    variant="outline"
    :class="['border-transparent font-medium text-[11px] px-1.5 py-0.5', style.bg, style.text]"
  >
    {{ label }}
  </Badge>
</template>
