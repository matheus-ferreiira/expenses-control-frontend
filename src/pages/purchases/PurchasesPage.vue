<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { ShoppingCart, Plus, Loader2, History, Trash2, Pencil } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@ui/alert-dialog'
import { useShoppingSessionStore } from '@/stores/shoppingSessions'
import { useShoppingSession } from '@/features/purchases/composables/useShoppingSession'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import ShoppingSessionCard from '@/features/purchases/components/ShoppingSessionCard.vue'
import ShoppingSessionView from '@/features/purchases/components/ShoppingSessionView.vue'
import FinishSessionSheet from '@/features/purchases/components/FinishSessionSheet.vue'
import NewSessionDialog from '@/features/purchases/components/NewSessionDialog.vue'
import ShoppingSessionDetailSheet from '@/features/purchases/components/ShoppingSessionDetailSheet.vue'

const store = useShoppingSessionStore()
const toast = useToast()

const {
  sessionViewOpen,
  finishSheetOpen,
  newSessionDialogOpen,
  deleteConfirmOpen,
  sessionToDelete,
  detailSheetOpen,
  selectedHistorySession,
  reopenConfirmOpen,
  sessionToReopen,
  openSessionView,
  openFinishSheet,
  openNewSessionDialog,
  requestDeleteSession,
  confirmDeleteSession,
  cancelDeleteSession,
  openHistoryDetail,
  requestReopenSession,
  confirmReopenSession,
  cancelReopenSession,
  handleSessionReopened,
} = useShoppingSession()

// ── Inline title edit ──────────────────────────────────────────────────────
const editingTitle = ref(false)
const editTitleValue = ref('')

function startTitleEdit() {
  if (!store.activeSession) return
  editTitleValue.value = store.activeSession.title
  editingTitle.value = true
  nextTick(() => {
    const el = document.getElementById('session-title-input') as HTMLInputElement | null
    el?.focus()
    el?.select()
  })
}

async function saveTitleEdit() {
  const title = editTitleValue.value.trim()
  if (!store.activeSession) { editingTitle.value = false; return }
  editingTitle.value = false
  if (title && title !== store.activeSession.title) {
    try {
      await store.updateSession(store.activeSession.id, { title })
    } catch {
      toast.error('Erro ao renomear lista')
    }
  }
}

function cancelTitleEdit() {
  editingTitle.value = false
}

// ────────────────────────────────────────────────────────────────────────────

onMounted(() => store.fetchSessions())

function onFinishSessionSheet() {
  finishSheetOpen.value = false
  sessionViewOpen.value = false
}
</script>

<template>
  <div class="p-5 space-y-6">
    <!-- Header -->
    <div>
      <p class="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/40 mb-1.5 select-none">
        PESSOAL
      </p>
      <h1 class="text-[22px] font-semibold text-foreground tracking-tight leading-tight">Compras</h1>
      <p class="mt-1 text-[13px] text-muted-foreground/60">Gerencie suas idas ao mercado.</p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 :size="20" class="animate-spin mr-2" />
      <span class="text-[13px]">Carregando...</span>
    </div>

    <template v-else>
      <!-- ── Sessão ativa ──────────────────────────────────────────── -->
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
          LISTA ATUAL
        </p>

        <!-- Active session card -->
        <div
          v-if="store.activeSession"
          class="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div class="h-0.5 bg-primary" />

          <div class="p-4">
            <!-- Top row -->
            <div class="flex items-start justify-between gap-2 mb-3">
              <div class="flex items-center gap-2">
                <span class="size-8 rounded-lg bg-primary/20 grid place-items-center shrink-0">
                  <ShoppingCart :size="15" class="text-primary" />
                </span>
                <span class="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  EM ANDAMENTO
                </span>
              </div>
              <button
                type="button"
                class="size-8 grid place-items-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                @click="requestDeleteSession(store.activeSession!)"
              >
                <Trash2 :size="14" />
              </button>
            </div>

            <!-- Inline title edit -->
            <div v-if="!editingTitle" class="flex items-center gap-1.5 group/title">
              <p class="text-[16px] font-semibold text-foreground flex-1">{{ store.activeSession.title }}</p>
              <button
                type="button"
                class="size-7 grid place-items-center rounded-lg text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover/title:opacity-100"
                @click="startTitleEdit"
              >
                <Pencil :size="13" />
              </button>
            </div>
            <input
              v-else
              id="session-title-input"
              v-model="editTitleValue"
              class="w-full text-[16px] font-semibold bg-transparent border-b border-primary/60 outline-none pb-0.5 text-foreground"
              @keydown.enter="saveTitleEdit"
              @keydown.escape="cancelTitleEdit"
              @blur="saveTitleEdit"
            />

            <div class="mt-2 flex items-center justify-between">
              <span class="text-[12px]">
                <span
                  v-if="store.activeSession.items_count > 0 && store.activeSession.bought_count === store.activeSession.items_count"
                  class="text-primary font-semibold"
                >✓ Tudo comprado!</span>
                <span v-else class="text-muted-foreground/70">
                  {{ store.activeSession.bought_count }} / {{ store.activeSession.items_count }} itens
                </span>
              </span>
              <span
                v-if="store.activeSession.suggested_total > 0"
                class="text-[12px] font-semibold tabular-nums text-primary"
              >
                {{ formatCurrency(store.activeSession.suggested_total) }}
              </span>
            </div>

            <div class="h-1.5 rounded-full bg-muted/30 overflow-hidden mt-2">
              <div
                class="h-full rounded-full bg-primary transition-all duration-500"
                :style="{
                  width: store.activeSession.items_count
                    ? `${Math.round((store.activeSession.bought_count / store.activeSession.items_count) * 100)}%`
                    : '0%',
                }"
              />
            </div>

            <div class="flex gap-2 mt-4">
              <button
                type="button"
                class="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity"
                @click="openSessionView"
              >
                Continuar compra
              </button>
              <button
                type="button"
                class="flex-1 h-10 rounded-lg bg-card border border-border text-foreground text-[13px] font-semibold hover:bg-muted/30 transition-colors"
                @click="openFinishSheet"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>

        <!-- No active session — CTA -->
        <button
          v-else
          type="button"
          class="w-full bg-card border border-border rounded-xl overflow-hidden flex hover:bg-card/80 transition-colors cursor-pointer"
          @click="openNewSessionDialog"
        >
          <div class="w-[2px] bg-primary shrink-0" />
          <div class="flex-1 p-5 flex flex-col items-center gap-3">
            <span class="size-12 rounded-xl bg-primary/20 grid place-items-center text-primary">
              <Plus :size="22" />
            </span>
            <div class="text-center">
              <p class="text-[15px] font-semibold text-foreground">Nova lista de compras</p>
              <p class="text-[13px] text-muted-foreground mt-0.5">Inicie uma nova ida ao mercado</p>
            </div>
          </div>
        </button>
      </div>

      <!-- ── Histórico ─────────────────────────────────────────────── -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            HISTÓRICO
          </p>
          <span class="flex items-center gap-1 text-[11px] text-muted-foreground/40">
            <History :size="11" />
            {{ store.finishedSessions.length }} registros
          </span>
        </div>

        <div v-if="store.finishedSessions.length === 0" class="py-10 text-center">
          <p class="text-[13px] text-muted-foreground/40">Nenhuma compra finalizada ainda.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ShoppingSessionCard
            v-for="session in store.finishedSessions"
            :key="session.id"
            :session="session"
            @open="openHistoryDetail(session)"
            @reopen="requestReopenSession(session)"
            @delete="requestDeleteSession(session)"
          />
        </div>
      </div>
    </template>
  </div>

  <!-- ShoppingSessionView sheet -->
  <ShoppingSessionView
    v-if="store.activeSession"
    v-model:open="sessionViewOpen"
    :session="store.activeSession"
    @finish="openFinishSheet"
  />

  <!-- FinishSessionSheet -->
  <FinishSessionSheet
    v-if="store.activeSession"
    v-model:open="finishSheetOpen"
    :session="store.activeSession"
    @finished="onFinishSessionSheet"
  />

  <!-- NewSessionDialog -->
  <NewSessionDialog v-model:open="newSessionDialogOpen" />

  <!-- History detail sheet -->
  <ShoppingSessionDetailSheet
    v-if="selectedHistorySession"
    v-model:open="detailSheetOpen"
    :session="selectedHistorySession"
    @reopened="handleSessionReopened"
  />

  <!-- Delete confirmation -->
  <AlertDialog v-model:open="deleteConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir lista?</AlertDialogTitle>
        <AlertDialogDescription>
          A lista <strong>"{{ sessionToDelete?.title }}"</strong> será excluída permanentemente. Essa ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelDeleteSession">Cancelar</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="confirmDeleteSession"
        >
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Reopen confirmation (from ⋮ menu) -->
  <AlertDialog v-model:open="reopenConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Reabrir lista?</AlertDialogTitle>
        <AlertDialogDescription>
          A lista <strong>"{{ sessionToReopen?.title }}"</strong> será reaberta como ativa. O vínculo com a transação será removido.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelReopenSession">Cancelar</AlertDialogCancel>
        <AlertDialogAction @click="confirmReopenSession">
          Reabrir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
