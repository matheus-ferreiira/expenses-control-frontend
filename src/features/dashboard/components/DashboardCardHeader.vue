<script setup lang="ts">
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'

/** Card header as on the Visão Geral list cards: uppercase title, optional count, green "Ver" link */
const props = defineProps<{
  title: string
  icon?: Component
  /** Small text next to the action, e.g. "2/5" or "3 itens" */
  count?: string | null
  actionLabel?: string
  /** Route name the action opens */
  to?: string
}>()

const router = useRouter()
</script>

<template>
  <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
    <p class="inline-flex items-center gap-1.5 min-w-0 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      <component :is="icon" v-if="icon" :size="14" class="shrink-0" aria-hidden="true" />
      <span class="truncate">{{ title }}</span>
    </p>
    <div class="flex items-center gap-3 shrink-0">
      <span v-if="count" class="text-[11px] text-muted-foreground tabular-nums">{{ count }}</span>
      <button
        v-if="to"
        type="button"
        class="inline-flex items-center gap-0.5 text-[12px] font-medium text-primary"
        @click="router.push({ name: props.to })"
      >
        {{ actionLabel ?? 'Ver' }}
        <ChevronRight :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
