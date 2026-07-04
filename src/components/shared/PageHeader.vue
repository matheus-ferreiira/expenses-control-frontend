<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'
import AppBreadcrumbs from './AppBreadcrumbs.vue'
import { moduleForRoute } from '@/constants/modules'

/**
 * Header padrão de página v3: trilha (Home › Módulo › Página) + chip de ícone
 * com a cor de identidade do módulo + título + descrição + ações à direita.
 * Ícone/cor vêm de `constants/modules.ts` pela rota — props sobrescrevem.
 */
const props = defineProps<{
  title: string
  subtitle?: string
  /** Sobrescreve o ícone derivado da rota */
  icon?: Component
  /** Sobrescreve a classe de cor do ícone (text-accent-*) */
  iconColor?: string
  /** Esconde a trilha (ex: Dashboard, que é a própria Home) */
  noBreadcrumbs?: boolean
  /** Esconde o chip de ícone */
  noIcon?: boolean
}>()

const route = useRoute()
const module_ = computed(() => moduleForRoute(String(route.name ?? '')))
const icon = computed(() => props.icon ?? module_.value?.icon)
const iconColor = computed(() => props.iconColor ?? module_.value?.colorClass ?? 'text-primary')
</script>

<template>
  <div class="mb-6 md:mb-8 pb-4 md:pb-6 border-b border-border">
    <AppBreadcrumbs v-if="!noBreadcrumbs" class="mb-3" />

    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 md:gap-4 min-w-0">
        <!-- Chip de ícone — cor de identidade do módulo, fundo cinza sólido -->
        <div
          v-if="icon && !noIcon"
          class="size-11 md:size-12 rounded-xl bg-muted grid place-items-center shrink-0"
          :class="iconColor"
        >
          <component :is="icon" class="size-[22px] md:size-6" />
        </div>

        <div class="min-w-0">
          <h1 class="text-[22px] md:text-[26px] font-semibold text-foreground tracking-tight leading-tight truncate">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="hidden md:block mt-1 text-[13px] text-muted-foreground leading-snug max-w-prose truncate">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div v-if="$slots.actions" class="flex flex-wrap items-center justify-end gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
