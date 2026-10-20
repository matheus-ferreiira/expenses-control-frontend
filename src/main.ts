import './assets/styles/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { usePwaUpdate, isChunkLoadError, reloadForNewBuild } from '@/composables/usePwaUpdate'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// A route chunk from the previous deploy is gone: reload into the new build (once)
router.onError((error) => {
  if (isChunkLoadError(error)) reloadForNewBuild()
})

app.mount('#app')

// Register the PWA service worker: looks for new deploys and reloads into them (see usePwaUpdate)
usePwaUpdate()
