<script setup lang="ts">
defineProps<{
  narrow?: boolean
}>()
</script>

<template>
  <div
    class="w-full px-6 py-6 mx-auto"
    :class="narrow ? 'max-w-3xl' : 'max-w-7xl'"
  >
    <slot />
  </div>
</template>
