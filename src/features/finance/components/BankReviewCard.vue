<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, Inbox } from 'lucide-vue-next'
import { bankConnectionsApi } from '@/services/api/bankConnections'
import { ROUTES } from '@/constants/routes'

/**
 * Visão Geral: quantas transações dos bancos conectados ainda não estão no app. Só aparece quando há algo
 * para lançar; a conta vem do backend (GET /finance/bank-connections/status).
 */
const router = useRouter()
const count = ref(0)

async function load() {
  try {
    const status = await bankConnectionsApi.status()
    count.value = status.configured ? status.to_review_count : 0
  } catch {
    count.value = 0
  }
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <button
    v-if="count > 0"
    type="button"
    class="w-full bg-card rounded-lg p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
    @click="router.push({ name: ROUTES.FINANCE_CONNECTIONS_REVIEW })"
  >
    <span class="flex items-center justify-center size-8 rounded-lg shrink-0 bg-muted">
      <Inbox :size="15" class="text-warning" />
    </span>
    <span class="flex-1 min-w-0">
      <span class="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Do banco</span>
      <span class="block text-[14px] font-medium mt-0.5">
        {{ count }} {{ count === 1 ? 'transação' : 'transações' }} para lançar
      </span>
    </span>
    <ChevronRight :size="16" class="text-muted-foreground shrink-0" />
  </button>
</template>
