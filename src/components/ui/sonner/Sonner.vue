<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { reactiveOmit } from "@vueuse/core"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-vue-next"
import { Toaster as Sonner } from "vue-sonner"

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, "toastOptions")
</script>

<template>
  <Sonner
    class="toaster group"
    :toast-options="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-md group-[.toaster]:text-[13px]',
        description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-[12px]',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        icon: 'group-[.toast]:[&>svg]:size-[14px]',
      },
    }"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-[14px]" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-[14px]" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-[14px]" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-[14px]" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-[14px] animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-[14px]" />
    </template>
  </Sonner>
</template>
