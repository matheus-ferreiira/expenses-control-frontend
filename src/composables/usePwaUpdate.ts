import { useRegisterSW } from 'virtual:pwa-register/vue'
import { watch } from 'vue'

export function usePwaUpdate() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(registration) {
      // Poll for updates every 60 minutes while the app is open
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  // With autoUpdate + skipWaiting, force reload when a new SW is ready
  watch(needRefresh, (val) => {
    if (val) updateServiceWorker(true)
  })

  return { needRefresh, updateServiceWorker }
}
