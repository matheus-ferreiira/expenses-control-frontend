<script setup lang="ts">
import { watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Textarea } from '@ui/textarea'
import { Label } from '@ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { Loader2 } from 'lucide-vue-next'
import type { Task, TaskLabel } from '@/types/tasks'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { useTaskForm } from '../composables/useTaskForm'
import { useTaskStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
  task?: Task | null
  labels: TaskLabel[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [task: Task]
  updated: [task: Task]
}>()

const store = useTaskStore()
const toast = useToast()
const { form, errors, submitting, fromTask, reset, validate, toPayload } = useTaskForm()

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.task) fromTask(props.task)
      else reset()
    }
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    if (props.task) {
      const updated = await store.updateTask(props.task.id, toPayload())
      emit('updated', updated)
      toast.success('Tarefa atualizada')
    } else {
      const created = await store.createTask(toPayload())
      emit('created', created)
      toast.success('Tarefa criada')
    }
    close()
  } catch {
    toast.error('Erro ao salvar tarefa')
  } finally {
    submitting.value = false
  }
}

const statuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const
const priorities = ['low', 'normal', 'high', 'urgent'] as const

function toggleLabel(id: string) {
  const idx = form.label_ids.indexOf(id)
  if (idx === -1) form.label_ids.push(id)
  else form.label_ids.splice(idx, 1)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ task ? 'Editar tarefa' : 'Nova tarefa' }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- Title -->
        <div class="space-y-1.5">
          <Label for="task-title">Título <span class="text-destructive">*</span></Label>
          <Input
            id="task-title"
            v-model="form.title"
            placeholder="O que precisa ser feito?"
            autofocus
            :class="errors.title && 'border-destructive'"
            @keydown.enter="submit"
          />
          <p v-if="errors.title" class="text-xs text-destructive">{{ errors.title }}</p>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <Label for="task-desc">Descrição</Label>
          <Textarea
            id="task-desc"
            v-model="form.description"
            placeholder="Detalhes opcionais..."
            class="min-h-[80px] resize-none text-sm"
          />
        </div>

        <!-- Status + Priority row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label>Status</Label>
            <Select v-model="form.status">
              <SelectTrigger class="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in statuses" :key="s" :value="s">
                  {{ TASK_STATUS_LABELS[s] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Prioridade</Label>
            <Select v-model="form.priority">
              <SelectTrigger class="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in priorities" :key="p" :value="p">
                  {{ TASK_PRIORITY_LABELS[p] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Due date + time row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="task-due-date">Data de entrega</Label>
            <Input id="task-due-date" v-model="form.due_date" type="date" class="h-9" />
          </div>
          <div class="space-y-1.5">
            <Label for="task-due-time">Horário</Label>
            <Input id="task-due-time" v-model="form.due_time" type="time" class="h-9" />
          </div>
        </div>

        <!-- Labels -->
        <div v-if="labels.length > 0" class="space-y-1.5">
          <Label>Labels</Label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="label in labels"
              :key="label.id"
              :class="[
                'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-base',
                form.label_ids.includes(label.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30',
              ]"
              type="button"
              @click="toggleLabel(label.id)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: label.color }" />
              {{ label.name }}
            </button>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" :disabled="submitting" @click="close">Cancelar</Button>
        <Button :disabled="submitting" @click="submit">
          <Loader2 v-if="submitting" :size="14" class="mr-1.5 animate-spin" />
          {{ task ? 'Salvar' : 'Criar tarefa' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
