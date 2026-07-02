<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AppPageContainer, ConfirmDialog, EmptyState } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import {
  ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Plus, Tag, Trash2, X,
} from 'lucide-vue-next'
import { DatePicker } from '@/components/ui/date-picker'
import PriceGoalBadge from '@/features/prices/components/PriceGoalBadge.vue'
import PriceRecordFormSheet from '@/features/prices/components/PriceRecordFormSheet.vue'
import { pricesApi } from '@/services/api/prices'
import { usePricesStore } from '@/stores/prices'
import { usePriceRecordFilters } from '@/features/prices/composables/usePriceRecordFilters'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { formatDay } from '@/features/prices/utils/priceHelpers'
import type { PriceRecord } from '@/features/prices/types'
import type { PaginationMeta } from '@/types/api'

const store = usePricesStore()
const toast = useToast()
const filters = usePriceRecordFilters()

const records = ref<PriceRecord[]>([])
const meta = ref<PaginationMeta | null>(null)
const loading = ref(false)

const formOpen = ref(false)
const editingRecord = ref<PriceRecord | null>(null)

const deleteOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleting = ref(false)

let fetchVersion = 0

async function fetchRecords() {
  const version = ++fetchVersion
  loading.value = true
  try {
    const result = await pricesApi.priceRecords.list(filters.toApiFilters())
    if (version !== fetchVersion) return
    records.value = result.data
    meta.value = result.meta
  } catch {
    if (version === fetchVersion) toast.error('Erro ao carregar registros de preço')
  } finally {
    if (version === fetchVersion) loading.value = false
  }
}

// Refetch when filters change (reset to page 1), and when page changes
watch([filters.productId, filters.storeId, filters.dateFrom, filters.dateTo], () => {
  filters.resetPage()
  fetchRecords()
})
watch(filters.page, fetchRecords)

onMounted(() => {
  store.ensureCatalog()
  fetchRecords()
})

const isEmpty = computed(
  () => !loading.value && records.value.length === 0 && !filters.hasActiveFilters.value,
)

function openCreate() {
  editingRecord.value = null
  formOpen.value = true
}

function openEdit(record: PriceRecord) {
  editingRecord.value = record
  formOpen.value = true
}

function requestDelete(id: string) {
  deletingId.value = id
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingId.value) return
  deleting.value = true
  try {
    await pricesApi.priceRecords.delete(deletingId.value)
    toast.success('Registro excluído')
    deleteOpen.value = false
    deletingId.value = null
    fetchRecords()
  } catch {
    toast.error('Erro ao excluir registro')
  } finally {
    deleting.value = false
  }
}

const canPrev = computed(() => (meta.value?.current_page ?? 1) > 1)
const canNext = computed(
  () => meta.value !== null && meta.value.current_page < meta.value.last_page,
)
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-1.5">
          Preços
        </p>
        <h1 class="text-[22px] lg:text-[18px] font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Registros
        </h1>
        <p class="text-[12px] text-muted-foreground">
          <template v-if="meta">{{ meta.total }} registro{{ meta.total !== 1 ? 's' : '' }}</template>
          <template v-else>Log de pesquisas de preço</template>
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
        @click="openCreate"
      >
        <Plus :size="14" />
        Registrar preço
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="relative">
        <select
          v-model="filters.productId.value"
          class="h-9 rounded-md border border-border/60 bg-card pl-3 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
          :class="!filters.productId.value ? 'text-muted-foreground/60' : ''"
        >
          <option :value="undefined">Todos os produtos</option>
          <option v-for="p in store.products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <ChevronDown :size="12" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
      </div>

      <div class="relative">
        <select
          v-model="filters.storeId.value"
          class="h-9 rounded-md border border-border/60 bg-card pl-3 pr-8 text-[12px] text-foreground focus:outline-none focus:border-primary/60 appearance-none cursor-pointer transition-colors"
          :class="!filters.storeId.value ? 'text-muted-foreground/60' : ''"
        >
          <option :value="undefined">Todas as lojas</option>
          <option v-for="s in store.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <ChevronDown :size="12" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
      </div>

      <DatePicker v-model="filters.dateFrom.value" placeholder="De" class="!h-9 !w-auto text-[12px]" />
      <DatePicker v-model="filters.dateTo.value" placeholder="Até" class="!h-9 !w-auto text-[12px]" />

      <button
        v-if="filters.hasActiveFilters.value"
        type="button"
        class="inline-flex items-center gap-1 h-9 px-2.5 rounded-md text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
        @click="filters.reset()"
      >
        <X :size="12" />
        Limpar
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <Skeleton v-for="i in 6" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Empty (no records at all) -->
    <EmptyState
      v-else-if="isEmpty"
      :icon="Tag"
      title="Nenhum preço registrado"
      description="Registre o primeiro preço que você encontrou para começar o histórico."
      cta-label="Registrar preço"
      @cta="openCreate"
    />

    <!-- Empty (filters active) -->
    <p
      v-else-if="records.length === 0"
      class="text-[13px] text-muted-foreground/60 py-12 text-center"
    >
      Nenhum registro encontrado com os filtros atuais.
    </p>

    <template v-else>
      <!-- Records list -->
      <div class="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div
          v-for="record in records"
          :key="record.id"
          class="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
          @click="openEdit(record)"
        >
          <span class="text-[12px] text-muted-foreground/60 tabular-nums shrink-0 w-16">
            {{ formatDay(record.recorded_at) }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-medium text-foreground truncate">
              {{ record.product?.name ?? '—' }}
            </p>
            <p class="text-[11px] text-muted-foreground/60 truncate">{{ record.store?.name ?? '—' }}</p>
          </div>
          <a
            v-if="record.url"
            :href="record.url"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-muted/40 transition-colors"
            @click.stop
          >
            <ExternalLink :size="13" />
          </a>
          <div class="text-right shrink-0">
            <p class="text-[14px] font-semibold tabular-nums text-foreground">
              {{ formatCurrency(record.price) }}
            </p>
            <PriceGoalBadge :status="record.goal_status" class="mt-0.5" />
          </div>
          <button
            type="button"
            aria-label="Excluir registro"
            class="shrink-0 p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
            @click.stop="requestDelete(record.id)"
          >
            <Trash2 :size="13" />
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between mt-4">
        <button
          type="button"
          class="inline-flex items-center gap-1 h-9 px-3 rounded-md text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="!canPrev"
          @click="filters.page.value--"
        >
          <ChevronLeft :size="14" />
          Anterior
        </button>
        <span class="text-[12px] text-muted-foreground/60 tabular-nums">
          Página {{ meta.current_page }} de {{ meta.last_page }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1 h-9 px-3 rounded-md text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="!canNext"
          @click="filters.page.value++"
        >
          Próxima
          <ChevronRight :size="14" />
        </button>
      </div>
    </template>
  </AppPageContainer>

  <PriceRecordFormSheet
    v-model:open="formOpen"
    :record="editingRecord"
    @saved="fetchRecords"
  />

  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir registro de preço"
    description="Este registro será removido permanentemente do histórico."
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
