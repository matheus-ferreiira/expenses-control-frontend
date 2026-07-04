<script setup lang="ts">
import AppBreadcrumbs from './AppBreadcrumbs.vue'

/**
 * Header padrão de página: trilha de navegação (Home › Módulo › Página) +
 * título + descrição (desktop) + slot de ações à direita.
 * `category` é aceito por compatibilidade mas a trilha o substitui.
 */
defineProps<{
  title: string
  subtitle?: string
  /** @deprecated a trilha de navegação substitui o eyebrow de categoria */
  category?: string
  /** Esconde a trilha (ex: Dashboard, que é a própria Home) */
  noBreadcrumbs?: boolean
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-border">
    <div class="min-w-0">
      <AppBreadcrumbs v-if="!noBreadcrumbs" />
      <h1 class="text-[22px] lg:text-[18px] font-semibold text-foreground tracking-tight leading-tight truncate">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="hidden md:block mt-1 text-[12px] text-muted-foreground leading-snug max-w-prose">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center justify-end gap-1.5 shrink-0 mt-0.5">
      <slot name="actions" />
    </div>
  </div>
</template>
