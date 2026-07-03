<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AppPageContainer, ConfirmDialog, EmptyState } from '@/components/shared'
import { Skeleton } from '@ui/skeleton'
import { Banknote, Pencil, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-vue-next'
import PurchaseFormSheet from '@/features/prices/components/PurchaseFormSheet.vue'
import SaleFormSheet from '@/features/prices/components/SaleFormSheet.vue'
import { pricesApi } from '@/services/api/prices'
import { usePricesStore } from '@/stores/prices'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/currency'
import { formatDay } from '@/features/prices/utils/priceHelpers'
import type {
  PricePatrimony,
  PricePatrimonyItem,
  PricePurchase,
} from '@/features/prices/types'

const store = usePricesStore()
const toast = useToast()

const loading = ref(false)
const patrimony = ref<PricePatrimony | null>(null)
const purchases = ref<PricePurchase[]>([])

async function loadData() {
  loading.value = true
  try {
    const [patrimonyResult, purchasesResult] = await Promise.all([
      pricesApi.reports.patrimony(),
      pricesApi.purchases.list(),
    ])
    patrimony.value = patrimonyResult
    purchases.value = purchasesResult
  } catch {
    toast.error('Erro ao carregar patrimônio')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  store.ensureCatalog()
})

const isEmpty = computed(
  () => !loading.value && (patrimony.value?.by_year.length ?? 0) === 0,
)

// ── Sheets ──────────────────────────────────────────────────────────────────
const purchaseFormOpen = ref(false)
const editingPurchase = ref<PricePurchase | null>(null)
const saleFormOpen = ref(false)
const sellingPurchase = ref<PricePurchase | null>(null)

const deleteOpen = ref(false)
const deleteTarget = ref<PricePatrimonyItem | null>(null)
const deleting = ref(false)

function findPurchase(purchaseId: string): PricePurchase | null {
  return purchases.value.find((p) => p.id === purchaseId) ?? null
}

function openCreatePurchase() {
  editingPurchase.value = null
  purchaseFormOpen.value = true
}

function openEditPurchase(item: PricePatrimonyItem) {
  const purchase = findPurchase(item.purchase_id)
  if (!purchase) return
  editingPurchase.value = purchase
  purchaseFormOpen.value = true
}

function openSale(item: PricePatrimonyItem) {
  const purchase = findPurchase(item.purchase_id)
  if (!purchase) return
  sellingPurchase.value = purchase
  saleFormOpen.value = true
}

function requestDelete(item: PricePatrimonyItem) {
  deleteTarget.value = item
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await pricesApi.purchases.delete(deleteTarget.value.purchase_id)
    toast.success('Compra excluída')
    deleteOpen.value = false
    deleteTarget.value = null
    loadData()
  } catch {
    toast.error('Erro ao excluir compra')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <AppPageContainer>
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          Preços
        </p>
        <h1 class="text-[22px] lg:text-[18px] font-semibold tracking-tight text-foreground leading-none mb-1.5">
          Minhas Compras
        </h1>
        <p class="text-[12px] text-muted-foreground">
          Patrimônio e linha do tempo das suas compras
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-colors mt-1"
        @click="openCreatePurchase"
      >
        <Plus :size="14" />
        Nova compra
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-32 w-full rounded-lg" />
      <Skeleton class="h-48 w-full rounded-lg" />
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="isEmpty"
      :icon="ShoppingBag"
      title="Nenhuma compra registrada"
      description="Registre os produtos que você comprou para montar a linha do tempo das suas compras."
      cta-label="Nova compra"
      @cta="openCreatePurchase"
    />

    <template v-else-if="patrimony">
      <!-- Patrimony KPI card -->
      <div class="bg-card rounded-lg p-4 mb-6">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Investido</p>
            <p class="text-[17px] font-semibold tabular-nums mt-1 text-foreground">
              {{ formatCurrency(patrimony.totals.invested) }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Valor atual</p>
            <p class="text-[17px] font-semibold tabular-nums mt-1 text-foreground">
              {{ formatCurrency(patrimony.totals.current_worth) }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Custo líquido</p>
            <p class="text-[17px] font-semibold tabular-nums mt-1 text-foreground">
              {{ formatCurrency(patrimony.totals.net_cost) }}
            </p>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-border space-y-1.5">
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground">Recuperado em vendas</p>
            <p class="text-[13px] font-semibold tabular-nums text-success">
              {{ formatCurrency(patrimony.totals.recovered) }}
            </p>
          </div>
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-widest text-muted-foreground">Depreciação</p>
            <p class="text-[13px] font-semibold tabular-nums text-destructive">
              {{ formatCurrency(patrimony.totals.depreciation) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Timeline by year -->
      <div v-for="yearGroup in patrimony.by_year" :key="yearGroup.year" class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[16px] font-semibold text-foreground tabular-nums">{{ yearGroup.year }}</p>
          <p class="text-[12px] text-muted-foreground tabular-nums">
            Investido: <span class="font-semibold">{{ formatCurrency(yearGroup.invested) }}</span>
          </p>
        </div>
        <div class="rounded-xl bg-card overflow-hidden">
          <div
            v-for="item in yearGroup.items"
            :key="item.purchase_id"
            class="px-4 py-3 border-b border-border last:border-0"
          >
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-[14px] font-medium text-foreground truncate">{{ item.product_name }}</p>
                  <span
                    v-if="item.is_sold"
                    class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-warning tabular-nums"
                  >
                    Vendido{{ item.sale_price !== null ? ` · ${formatCurrency(item.sale_price)}` : '' }}
                  </span>
                </div>
                <p class="text-[12px] text-muted-foreground tabular-nums mt-0.5">
                  {{ formatDay(item.purchased_at) }}
                  <template v-if="item.warranty_months !== null">
                    · <ShieldCheck :size="11" class="inline -mt-0.5" /> {{ item.warranty_months }} meses
                  </template>
                  <template v-if="!item.is_sold && item.current_value !== null">
                    · vale hoje <span class="font-semibold">{{ formatCurrency(item.current_value) }}</span>
                  </template>
                </p>
              </div>
              <p class="text-[14px] font-semibold tabular-nums text-foreground shrink-0">
                {{ formatCurrency(item.price_paid) }}
              </p>
            </div>
            <!-- Item actions -->
            <div class="flex items-center justify-end gap-1 mt-2">
              <button
                v-if="!item.is_sold"
                type="button"
                class="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] font-medium text-primary hover:brightness-110 transition-colors"
                @click="openSale(item)"
              >
                <Banknote :size="13" />
                Registrar venda
              </button>
              <button
                type="button"
                aria-label="Editar compra"
                class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                @click="openEditPurchase(item)"
              >
                <Pencil :size="13" />
              </button>
              <button
                type="button"
                aria-label="Excluir compra"
                class="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                @click="requestDelete(item)"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppPageContainer>

  <PurchaseFormSheet
    v-model:open="purchaseFormOpen"
    :purchase="editingPurchase"
    @saved="loadData"
  />

  <SaleFormSheet
    v-model:open="saleFormOpen"
    :purchase="sellingPurchase"
    @saved="loadData"
  />

  <ConfirmDialog
    v-model:open="deleteOpen"
    title="Excluir compra"
    :description="`'${deleteTarget?.product_name}' será removida das suas compras, junto com a venda vinculada.`"
    confirm-label="Excluir"
    variant="destructive"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>
