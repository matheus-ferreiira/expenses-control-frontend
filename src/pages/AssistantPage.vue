<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { MessageCircle, Plus, Send, LoaderCircle } from 'lucide-vue-next'
import { AppPageContainer, PageHeader } from '@/components/shared'
import AssistantProposal from '@/features/assistant/components/AssistantProposal.vue'
import { assistantApi } from '@/services/api/assistant'
import type { AssistantConversation, AssistantMessage } from '@/types/assistant'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const configured = ref<boolean | null>(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const conversations = ref<AssistantConversation[]>([])
const selected = ref<AssistantConversation | null>(null)
const draft = ref('')
const page = ref(1)
const hasMore = ref(false)
const bottom = ref<HTMLElement | null>(null)
const timezone = computed(() => auth.user?.timezone || 'America/Sao_Paulo')
const date = ref(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone.value,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)
const retry = ref<{
  conversation: string
  message: string
  date: string
  request_id: string
} | null>(null)
const suggestions = [
  'Organize meu dia com minhas tarefas e hábitos.',
  'Monte uma rotina de estudos para esta semana.',
  'Encontre um horário para treinar na minha agenda.',
]
const disabled = computed(() => busy.value || loading.value)

function report(cause: unknown) {
  error.value = isAxiosError(cause)
    ? (cause.response?.data?.message ??
      'Não foi possível conectar. Confira sua conexão e tente novamente.')
    : 'Não foi possível concluir. Tente novamente.'
}

async function list(append = false) {
  const requested = append ? page.value + 1 : 1
  const result = await assistantApi.list(requested)
  conversations.value = append ? [...conversations.value, ...result.items] : result.items
  hasMore.value = result.has_more
  page.value = requested
}

async function initialize() {
  loading.value = true
  error.value = ''
  try {
    configured.value = (await assistantApi.status()).configured
    await list()
    if (selected.value) selected.value = await assistantApi.get(selected.value.id)
    else if (conversations.value[0])
      selected.value = await assistantApi.get(conversations.value[0].id)
  } catch (cause) {
    report(cause)
  } finally {
    loading.value = false
  }
}

async function select(conversation: AssistantConversation) {
  if (disabled.value) return
  loading.value = true
  error.value = ''
  try {
    selected.value = await assistantApi.get(conversation.id)
    draft.value = ''
    retry.value = null
  } catch (cause) {
    report(cause)
  } finally {
    loading.value = false
  }
}

function newConversation() {
  selected.value = null
  draft.value = ''
  retry.value = null
  error.value = ''
}

async function more() {
  loading.value = true
  try {
    await list(true)
  } catch (cause) {
    report(cause)
  } finally {
    loading.value = false
  }
}

async function scrollBottom() {
  await nextTick()
  bottom.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

async function send() {
  const text = draft.value.trim()
  if (!text || !date.value || disabled.value || !configured.value) return
  busy.value = true
  error.value = ''
  try {
    if (!selected.value) selected.value = await assistantApi.create()
    if (
      !retry.value ||
      retry.value.message !== text ||
      retry.value.date !== date.value ||
      retry.value.conversation !== selected.value.id
    ) {
      retry.value = {
        conversation: selected.value.id,
        message: text,
        date: date.value,
        request_id: crypto.randomUUID(),
      }
    }
    await assistantApi.send(selected.value.id, retry.value)
    draft.value = ''
    retry.value = null
    selected.value = await assistantApi.get(selected.value.id)
    await list()
    await scrollBottom()
  } catch (cause) {
    report(cause)
  } finally {
    busy.value = false
  }
}

async function decide(message: AssistantMessage, approve: boolean) {
  if (!selected.value || disabled.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await (approve ? assistantApi.approve : assistantApi.reject)(
      selected.value.id,
      message.id,
    )
    selected.value.messages = selected.value.messages?.map((item) =>
      item.id === result.id ? result : item,
    )
  } catch (cause) {
    report(cause)
  } finally {
    busy.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void send()
  }
}

onMounted(initialize)
</script>

<template>
  <AppPageContainer>
    <PageHeader
      title="Assistente"
      subtitle="Planeje sua rotina e transforme a conversa em ações."
      :icon="MessageCircle"
      compact-mobile
    >
      <template #actions>
        <button
          :disabled="disabled"
          class="inline-flex h-11 items-center gap-2 rounded-lg bg-muted px-4 text-[13px] font-medium disabled:opacity-40"
          @click="newConversation"
        >
          <Plus class="size-4" /> Nova conversa
        </button>
      </template>
    </PageHeader>

    <div class="mt-3 grid items-start gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-3">
        <section class="rounded-lg bg-card p-4 space-y-3">
          <h2 class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Sua rotina, organizada
          </h2>
          <p class="text-[13px] leading-relaxed">
            O assistente consulta suas tarefas, hábitos e agenda. Você revisa a proposta e aprova
            para cadastrar ou alterar os itens.
          </p>
          <label for="planning-date" class="block text-[12px] font-medium"
            >Data do planejamento</label
          >
          <input
            id="planning-date"
            v-model="date"
            type="date"
            :disabled="disabled"
            class="h-11 w-full min-w-0 rounded-lg bg-muted px-3 text-[14px] focus-visible:ring-2 focus-visible:ring-primary"
          />
          <p class="text-[12px] text-muted-foreground">
            Agenda dos 14 dias a partir desta data, tarefas pendentes e hábitos ativos. Horários em
            {{ timezone }}.
          </p>
          <p class="text-[12px] text-muted-foreground">
            Sua mensagem e os dados necessários desses módulos são enviados à OpenAI para preparar a
            resposta.
          </p>
        </section>
        <details class="rounded-lg bg-card p-4" open>
          <summary
            class="cursor-pointer text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Conversas
          </summary>
          <div class="mt-3 max-h-52 overflow-y-auto space-y-1 lg:max-h-96">
            <p v-if="!conversations.length" class="text-[13px] text-muted-foreground">
              Suas conversas ficam salvas aqui.
            </p>
            <button
              v-for="conversation in conversations"
              :key="conversation.id"
              :disabled="disabled"
              class="block w-full truncate rounded-md px-3 py-2 text-left text-[13px] focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
              :class="
                selected?.id === conversation.id
                  ? 'bg-primary/15 font-semibold text-primary'
                  : 'hover:bg-muted'
              "
              :aria-pressed="selected?.id === conversation.id"
              @click="select(conversation)"
            >
              {{ conversation.title }}
            </button>
            <button
              v-if="hasMore"
              :disabled="disabled"
              class="h-11 px-3 text-[13px] text-primary"
              @click="more"
            >
              Carregar mais
            </button>
          </div>
        </details>
      </aside>

      <section
        class="min-w-0 rounded-lg bg-card p-4"
        aria-label="Chat com o assistente"
        :aria-busy="busy || loading"
      >
        <div v-if="loading" class="space-y-3 py-4" role="status" aria-label="Carregando conversa">
          <div class="h-12 animate-pulse rounded-md bg-muted" />
          <div class="h-20 animate-pulse rounded-md bg-muted" />
        </div>
        <div
          v-else-if="configured === false"
          class="rounded-md bg-muted p-4 text-[13px] leading-relaxed"
        >
          <p class="font-semibold">O assistente está aguardando ativação</p>
          <p class="mt-1 text-muted-foreground">
            A conexão com a OpenAI precisa ser configurada pelo responsável pelo aplicativo. Suas
            conversas salvas continuam disponíveis.
          </p>
        </div>
        <div v-if="!loading && !selected?.messages?.length" class="py-8 text-center">
          <MessageCircle class="mx-auto mb-3 size-8 text-primary" />
          <h2 class="text-[18px] font-semibold">Como você quer organizar seu dia?</h2>
          <p class="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
            Conte seus horários e prioridades. Podemos ajustar o plano juntos antes de aplicar.
          </p>
          <div class="mx-auto mt-5 flex max-w-lg flex-col gap-2">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              :disabled="disabled || !configured"
              class="rounded-md bg-muted px-3 py-3 text-left text-[13px] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary"
              @click="draft = suggestion"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
        <div
          v-if="!loading"
          class="space-y-5 max-h-[65dvh] overflow-y-auto overscroll-contain pr-1"
          role="log"
          aria-label="Mensagens"
          aria-live="polite"
        >
          <article
            v-for="message in selected?.messages"
            :key="message.id"
            class="min-w-0"
            :class="message.role === 'user' ? 'ml-4 rounded-lg bg-muted p-3 sm:ml-12' : 'py-2'"
          >
            <p
              class="mb-2 text-[11px] font-semibold uppercase tracking-widest"
              :class="message.role === 'user' ? 'text-muted-foreground' : 'text-primary'"
            >
              {{ message.role === 'user' ? 'Você' : 'Assistente' }}
            </p>
            <p class="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
              {{ message.content }}
            </p>
            <AssistantProposal
              v-if="message.actions?.length"
              :message="message"
              :busy="disabled"
              @approve="decide(message, true)"
              @reject="decide(message, false)"
            />
          </article>
          <div ref="bottom" />
        </div>
        <p
          v-if="busy"
          role="status"
          class="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground"
        >
          <LoaderCircle class="size-4 animate-spin" /> Processando sua solicitação…
        </p>
        <div v-if="error" role="alert" class="mt-4 rounded-md bg-muted p-3 text-[13px]">
          <p class="text-destructive">{{ error }}</p>
          <button
            :disabled="disabled"
            class="mt-2 text-primary underline underline-offset-4"
            @click="initialize"
          >
            Atualizar conversa
          </button>
        </div>
        <form class="mt-5 space-y-2 border-t border-border pt-4" @submit.prevent="send">
          <label for="assistant-message" class="sr-only">Mensagem para o assistente</label>
          <textarea
            id="assistant-message"
            v-model="draft"
            :disabled="disabled || !configured"
            maxlength="6000"
            rows="3"
            placeholder="Ex.: Organize amanhã. Trabalho das 9h às 18h e quero estudar por 1 hora."
            class="w-full resize-y rounded-lg bg-muted p-3 text-[14px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
            @keydown="onKeydown"
          />
          <div class="flex items-center justify-between gap-3">
            <p class="text-[11px] text-muted-foreground">
              Enter envia · Shift + Enter quebra a linha
            </p>
            <button
              type="submit"
              :disabled="disabled || !configured || !draft.trim() || !date"
              class="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-medium text-primary-foreground disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Send class="size-4" /> Enviar
            </button>
          </div>
        </form>
      </section>
    </div>
  </AppPageContainer>
</template>
