<script setup lang="ts">
import { ref } from 'vue'
import { Loader2, Trash2, MapPin, AlignLeft, Repeat2 } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { DatePicker } from '@ui/date-picker'
import { Checkbox } from '@ui/checkbox'
import { ConfirmDialog } from '@/components/shared'
import type { EventColor } from '@/types/calendar'
import { useEventForm } from '../composables/useEventForm'

const form = useEventForm()
const confirmDeleteOpen = ref(false)

const EVENT_COLORS: { id: EventColor; label: string; hex: string }[] = [
  { id: 'blue', label: 'Azul', hex: 'hsl(217 91% 60%)' },
  { id: 'green', label: 'Verde', hex: 'hsl(142 71% 45%)' },
  { id: 'yellow', label: 'Amarelo', hex: 'hsl(38 92% 50%)' },
  { id: 'red', label: 'Vermelho', hex: 'hsl(0 63% 51%)' },
  { id: 'pink', label: 'Rosa', hex: 'hsl(330 81% 60%)' },
  { id: 'orange', label: 'Laranja', hex: 'hsl(24 95% 53%)' },
  { id: 'slate', label: 'Cinza', hex: 'hsl(215 16% 47%)' },
]

defineExpose({ openCreate: form.openCreate, openEdit: form.openEdit })
</script>

<template>
  <Dialog :open="form.open.value" @update:open="(v) => !v && form.close()">
    <DialogContent class="sm:max-w-[460px] p-0 gap-0 overflow-hidden">
      <!-- Color accent bar -->
      <div
        class="h-0.5 w-full"
        :style="{ background: EVENT_COLORS.find(c => c.id === form.color.value)?.hex ?? 'hsl(262 83% 58%)' }"
      />

      <div class="px-5 pt-4 pb-5 space-y-4">
        <DialogHeader class="pb-0">
          <DialogTitle class="text-[15px] font-semibold">
            {{ form.mode.value === 'create' ? 'Novo evento' : 'Editar evento' }}
          </DialogTitle>
        </DialogHeader>

        <!-- Title -->
        <Input
          v-model="form.title.value"
          placeholder="Título do evento"
          class="text-[14px] h-9"
          autofocus
          @keydown.enter="form.submit()"
        />

        <!-- All-day toggle -->
        <div class="flex items-center gap-2.5">
          <Checkbox
            id="all-day"
            :checked="form.isAllDay.value"
            @update:checked="form.onAllDayChange($event as boolean)"
          />
          <label for="all-day" class="text-[13px] text-muted-foreground cursor-pointer select-none">
            Dia todo
          </label>
        </div>

        <!-- Date/time pickers -->
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <p class="text-[10px] font-medium uppercase tracking-[0.08em]" style="color: hsl(var(--muted-foreground) / 0.5)">Início</p>
            <input
              v-if="!form.isAllDay.value"
              v-model="form.startLocal.value"
              type="datetime-local"
              class="w-full h-8 px-2.5 rounded-md text-[12px] bg-transparent border outline-none transition-base"
              style="border-color: hsl(var(--border)); color: hsl(var(--foreground)); color-scheme: dark"
              @change="form.onStartChange()"
            />
            <DatePicker
              v-else
              v-model="form.startLocal.value"
              class="h-8 text-[12px]"
            />
          </div>
          <div class="space-y-1">
            <p class="text-[10px] font-medium uppercase tracking-[0.08em]" style="color: hsl(var(--muted-foreground) / 0.5)">Fim</p>
            <input
              v-if="!form.isAllDay.value"
              v-model="form.endLocal.value"
              type="datetime-local"
              class="w-full h-8 px-2.5 rounded-md text-[12px] bg-transparent border outline-none transition-base"
              style="border-color: hsl(var(--border)); color: hsl(var(--foreground)); color-scheme: dark"
            />
            <DatePicker
              v-else
              v-model="form.endLocal.value"
              class="h-8 text-[12px]"
            />
          </div>
        </div>

        <!-- Location -->
        <div class="flex items-center gap-2">
          <MapPin :size="13" style="color: hsl(var(--muted-foreground) / 0.4)" class="shrink-0" />
          <Input
            v-model="form.location.value"
            placeholder="Local (opcional)"
            class="text-[13px] h-8 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            style="border-color: hsl(var(--border) / 0.5)"
          />
        </div>

        <!-- Description -->
        <div class="flex items-start gap-2">
          <AlignLeft :size="13" style="color: hsl(var(--muted-foreground) / 0.4)" class="shrink-0 mt-1.5" />
          <textarea
            v-model="form.description.value"
            placeholder="Descrição (opcional)"
            rows="2"
            class="flex-1 bg-transparent outline-none text-[13px] leading-relaxed resize-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <!-- Color picker -->
        <div class="space-y-1.5">
          <p class="text-[10px] font-medium uppercase tracking-[0.08em]" style="color: hsl(var(--muted-foreground) / 0.5)">Cor</p>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="c in EVENT_COLORS"
              :key="c.id"
              class="h-5 w-5 rounded-full transition-base"
              :style="{
                background: c.hex,
                opacity: form.color.value === c.id ? 1 : 0.55,
                outline: form.color.value === c.id ? `2px solid ${c.hex}` : 'none',
                outlineOffset: '2px',
              }"
              :title="c.label"
              @click="form.color.value = c.id"
            />
          </div>
        </div>

        <!-- Recurrence -->
        <div class="flex items-center gap-2">
          <Repeat2 :size="13" style="color: hsl(var(--muted-foreground) / 0.4)" class="shrink-0" />
          <select
            v-model="form.recurrenceFreq.value"
            class="flex-1 bg-transparent outline-none text-[13px] border-0 border-b rounded-none px-0 h-8 cursor-pointer"
            style="border-color: hsl(var(--border) / 0.5); color: hsl(var(--foreground) / 0.8)"
          >
            <option value="none" style="background: hsl(var(--card))">Não repete</option>
            <option value="daily" style="background: hsl(var(--card))">Diariamente</option>
            <option value="weekly" style="background: hsl(var(--card))">Semanalmente</option>
            <option value="monthly" style="background: hsl(var(--card))">Mensalmente</option>
            <option value="yearly" style="background: hsl(var(--card))">Anualmente</option>
          </select>
        </div>

        <!-- Footer actions -->
        <div class="flex items-center justify-between pt-1">
          <button
            v-if="form.mode.value === 'edit'"
            class="flex items-center gap-1.5 text-[12px] transition-base"
            style="color: hsl(var(--destructive) / 0.7)"
            :disabled="form.submitting.value"
            @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--destructive))'"
            @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--destructive) / 0.7)'"
            @click="confirmDeleteOpen = true"
          >
            <Trash2 :size="13" />
            Excluir
          </button>
          <div v-else />

          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" class="h-8 text-[13px]" @click="form.close()">
              Cancelar
            </Button>
            <Button
              size="sm"
              class="h-8 text-[13px]"
              :disabled="!form.isValid.value || form.submitting.value"
              @click="form.submit()"
            >
              <Loader2 v-if="form.submitting.value" :size="13" class="mr-1.5 animate-spin" />
              {{ form.mode.value === 'create' ? 'Criar' : 'Salvar' }}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <ConfirmDialog
    :open="confirmDeleteOpen"
    title="Excluir evento"
    description="Esta ação não pode ser desfeita."
    variant="destructive"
    confirm-label="Excluir"
    :loading="form.submitting.value"
    @update:open="confirmDeleteOpen = $event"
    @confirm="form.deleteEvent()"
  />
</template>
