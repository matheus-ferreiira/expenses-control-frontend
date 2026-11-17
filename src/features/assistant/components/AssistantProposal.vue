<script setup lang="ts">
import { computed } from 'vue'
import { Check, CheckCheck, X, Clock3 } from 'lucide-vue-next'
import type { AssistantMessage } from '@/types/assistant'
import { entityLabels, operationLabels, proposalRows } from '../utils/proposal'

const props = defineProps<{ message: AssistantMessage; busy: boolean }>()
defineEmits<{ approve: []; reject: [] }>()
const expired = computed(
  () => !!props.message.expires_at && new Date(props.message.expires_at).getTime() <= Date.now(),
)
const status = computed(
  () =>
    ({
      applied: 'Plano aplicado',
      rejected: 'Proposta descartada',
      superseded: 'Substituída por uma nova resposta',
      pending: expired.value
        ? 'Proposta expirada — peça um novo plano'
        : 'Confira antes de aplicar',
    })[props.message.status ?? 'pending'],
)
const containsDeletion = computed(() =>
  props.message.actions?.some((a) => a.operation === 'delete'),
)
const routes = { task: '/tasks', habit: '/habits', event: '/calendar' }
const resultEntities = computed(() => [
  ...new Set(props.message.results?.map((r) => r.entity) ?? []),
])
</script>

<template>
  <section class="mt-4 space-y-3" aria-label="Proposta de alterações">
    <div
      class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
      role="status"
    >
      <CheckCheck v-if="message.status === 'applied'" class="size-4 text-primary" />
      <Clock3 v-else class="size-4" />
      {{ status }}
    </div>
    <details
      v-for="(action, index) in message.actions"
      :key="index"
      class="rounded-md bg-muted px-3 py-2"
      open
    >
      <summary class="cursor-pointer text-[13px] font-medium leading-6 break-words">
        <span :class="action.operation === 'delete' ? 'text-destructive' : 'text-primary'">{{
          operationLabels[action.operation]
        }}</span>
        {{ entityLabels[action.entity].toLowerCase() }} ·
        {{ action.data.title ?? action.data.name ?? action.before?.title ?? action.before?.name }}
      </summary>
      <dl class="mt-2 space-y-2 text-[12px]">
        <div
          v-for="row in proposalRows(action)"
          :key="row.key"
          class="grid grid-cols-[100px_minmax(0,1fr)] gap-2"
        >
          <dt class="text-muted-foreground">{{ row.label }}</dt>
          <dd class="whitespace-pre-wrap break-words">
            <span
              v-if="row.before !== null && row.before !== row.value"
              class="block text-muted-foreground"
              >Antes: {{ row.before }}</span
            >
            {{ row.value }}
          </dd>
        </div>
      </dl>
      <p v-if="action.timezone" class="mt-2 text-[11px] text-muted-foreground">
        Horários em {{ action.timezone }}
      </p>
    </details>
    <template v-if="message.status === 'pending' && !expired">
      <p class="text-[12px] text-muted-foreground">
        {{ message.actions?.length }} alterações. Ao aprovar, todos os itens acima serão aplicados
        ao seu app.
      </p>
      <p v-if="containsDeletion" class="text-[12px] text-destructive">
        Este plano também exclui os itens indicados acima.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          :disabled="busy"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-medium text-primary-foreground disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary"
          @click="$emit('approve')"
        >
          <Check class="size-4" /> Aprovar e aplicar
        </button>
        <button
          type="button"
          :disabled="busy"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-muted px-4 text-[14px] font-medium disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary"
          @click="$emit('reject')"
        >
          <X class="size-4" /> Descartar
        </button>
      </div>
      <p class="text-[12px] text-muted-foreground">
        Quer mudar algo? Escreva o ajuste no chat antes de aprovar.
      </p>
    </template>
    <div v-if="message.status === 'applied'" class="flex flex-wrap gap-3">
      <RouterLink
        v-for="entity in resultEntities"
        :key="entity"
        :to="routes[entity]"
        class="text-[13px] font-medium text-primary underline underline-offset-4"
        >Ver {{ { task: 'tarefas', habit: 'hábitos', event: 'agenda' }[entity] }}</RouterLink
      >
    </div>
  </section>
</template>
